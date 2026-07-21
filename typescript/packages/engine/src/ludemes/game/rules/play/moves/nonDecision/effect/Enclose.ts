// @java Core/src/game/rules/play/moves/nonDecision/effect/Enclose.java
/**
 * Applies a move to an enclosed group.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/Enclose.java
 *
 * @remarks A group of components is 'enclosed' if it has no adjacent empty
 *          sites, where board sides count as boundaries. This ludeme is used
 *          for surround capture games such as Go.
 *
 *          Coverage-only transliteration. NOT registered in the 1:1 moves
 *          registry. The live path is handled by Enclose1to1.ts (if exists).
 */

import type { Context } from "../../../../../../../context.js";
import type { BooleanFunction, DirectionsFunction, IntFunction, MovesFunction } from "../../../../../../base.js";
import type { Move } from "../../../../../../../move.js";
import type { Then } from "./Then.js";
import { applyPostStateThen } from "./Then.js";
import type { SiteType } from "../../../../../../../action/site-type.js";
import type { From } from "../../../../../util/moves/From.js";
import type { Between } from "../../../../../util/moves/Between.js";
import { Who } from "../../../../../functions/ints/state/Who.js";
import type { JavaIntFunction } from "../../../../../functions/ints/IntFunction.js";
import { IsEnemy } from "../../../../../functions/booleans/is/player/IsEnemy.js";
import { Move as LudiiMove } from "../../../../../../../move.js";
import { Remove } from "./Remove.js";

type DirectionArg = string | DirectionsFunction;

const LAST_TO: IntFunction = { eval: (ctx) => ctx._evalTo };
const BETWEEN: IntFunction = { eval: (ctx) => ctx._evalBetween };

/** Topology interface needed for adjacency queries */
interface TopoElement {
  readonly index: number;
}

interface Trajectory {
  steps(type: string, from: number, toType: string, dir: string): Array<{ to: { id: () => number } }>;
}

interface GraphElements extends Array<TopoElement> {
  readonly length: number;
}

interface Topology {
  getGraphElements(type: string): GraphElements;
  trajectories(): Trajectory;
}

export class Enclose implements MovesFunction {
  /** @java Enclose.startFn */
  private readonly startFn: IntFunction;

  /** @java Enclose.dirnChoice */
  private readonly dirnChoice: DirectionArg;

  /** @java Enclose.targetRule — condition on between sites */
  private readonly targetRule: BooleanFunction;

  /** @java Enclose.numEmptySitesInGroupEnclosed — liberties allowed */
  private readonly numEmptySitesInGroup: IntFunction;

  /** @java Enclose.effect — move applied on each enclosed site */
  private readonly effect: MovesFunction;

  /** @java Enclose.type */
  private readonly type: SiteType | null;

  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Enclose.java — constructor
   */
  public constructor(
    type?: SiteType | null,
    from?: From | null,
    directions?: DirectionArg | null,
    between?: Between | null,
    numException?: IntFunction | null,
    then?: Then | null,
  ) {
    this.startFn = from?.loc() ?? LAST_TO;
    this.dirnChoice = directions ?? "Adjacent";
    this.targetRule = between?.condition() ?? new IsEnemy(new Who(null, BETWEEN as unknown as JavaIntFunction), null);
    this.numEmptySitesInGroup = numException ?? { eval: () => 0 };
    this.effect = between?.effect() ?? new Remove({
      locationFn: BETWEEN,
      regionFn: null,
      countFn: null,
      levelFn: null,
      type: null,
      when: null,
      then: null,
    });
    this.type = type ?? null;
    this.thenClause = then ?? null;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Enclose.java — eval(Context)
   *
   * 1. Resolve from = startFn.eval(context)
   * 2. Get adjacency around from (satisfying targetRule or empty if numException > 0)
   * 3. BFS expand each group of target-satisfying sites
   * 4. If group has no liberties (empty neighbours outside the group), apply effect
   */
  public eval(ctx: Context): Move[] {
    const from = this.startFn.eval(ctx);
    if (from < 0) return [];

    const origBetween = ctx._evalBetween;
    const origTo = ctx._evalTo;

    // Topology lookup — requires topology on context
    const ctxAny = ctx as unknown as {
      topology?: Topology;
      _siteType?: string;
    };

    // Engine ctx duck-typing: topology is a FUNCTION on the engine context.
    const topoRaw = ctxAny.topology as unknown;
    const topology = (typeof topoRaw === "function" ? (topoRaw as () => Topology).call(ctx) : topoRaw) as Topology | undefined;
    if (!topology) {
      throw new Error("not yet wired: Enclose requires topology on Context");
    }

    // @java realType = (type == null) ? context.board().defaultSite() : type
    const realType = this.type ?? ctxAny._siteType
      ?? (ctx as unknown as { board?: () => { defaultSite?: () => string } }).board?.()?.defaultSite?.()
      ?? "Cell";
    const graphElements = topology.getGraphElements(realType);
    if (from >= graphElements.length) return [];

    const numException = this.numEmptySitesInGroup.eval(ctx);
    const mover = ctx.state.mover;
    const cs = ctx.state;

    // @java Enclose.java:146-163 — get all sites around from satisfying targetRule
    const isTarget = (loc: number): boolean => {
      ctx._evalBetween = loc;
      return this.targetRule.eval(ctx);
    };

    // @java Enclose.java:140 — atLeastAnEmpty = targetRule.concepts(game).get(IsEmpty).
    // The concept system is not surfaced on the TS BooleanFunction, so compute
    // the equivalent at runtime: the rule "can match empty" iff isTarget is true
    // at some empty site (the IsEmpty sub-clause is true for every empty site).
    // When true, a region is enclosed ONLY if its surrounding boundary forms a
    // SINGLE connected group — without this, a lone stone "encloses" the whole
    // board (Mig Mang set state on 288 sites at ply 0).
    let atLeastAnEmpty = false;
    {
      const savedBetween = ctx._evalBetween;
      for (let s = 0; s < graphElements.length; s++) {
        if (cs.whatAtSite(s) === 0) {
          ctx._evalBetween = s;
          if (this.targetRule.eval(ctx)) atLeastAnEmpty = true;
          break;
        }
      }
      ctx._evalBetween = savedBetween;
    }

    const aroundTarget: number[] = [];
    const trajectories = topology.trajectories();
    // Engine trajectories expose steps(site, dir) / group(site, name); the
    // Java-style 4-arg steps(type, site, type, dir) silently returns [] there
    // (NoGo's NoCapture filter never saw any neighbours).
    const engTraj = (ctx as unknown as { _trajectories?: { group?(site: number, name: string): number[] } })._trajectories;
    const stepsOf = (site: number, direction: string): number[] => {
      if (engTraj && typeof engTraj.group === "function") return engTraj.group(site, direction);
      const javaSteps = (trajectories as unknown as { steps?: (...args: unknown[]) => Array<{ to: { id(): number } }> }).steps;
      if (typeof javaSteps === "function" && javaSteps.length >= 4) {
        return (javaSteps.call(trajectories, realType, site, realType, direction) ?? []).map((st) => st.to.id());
      }
      return [];
    };
    for (const direction of this.directionNames(ctx)) {
      for (const between of stepsOf(from, direction)) {
        if (!aroundTarget.includes(between)) {
          if (isTarget(between)) {
            aroundTarget.push(between);
          } else if (numException > 0 && cs.whatAtSite(between) === 0) {
            aroundTarget.push(between);
          }
        }
      }
    }

    const sitesChecked: boolean[] = new Array(graphElements.length).fill(false);
    const allMoves: LudiiMove[] = [];
    const graphSize = graphElements.length;

    // @java Enclose.java:170-305 — for each potential target, BFS and check liberties
    aroundTargetLoop:
    for (const target of aroundTarget) {
      if (sitesChecked[target]) continue;

      let numExceptionToUse = numException;
      if (numExceptionToUse > 0 && cs.whatAtSite(target) === 0) {
        numExceptionToUse--;
      }

      // BFS to find the connected group
      const enclosedGroup: boolean[] = new Array(graphSize).fill(false);
      const enclosedGroupList: number[] = [];
      enclosedGroup[target] = true;
      enclosedGroupList.push(target);

      let i = 0;
      while (i < enclosedGroupList.length) {
        const site = enclosedGroupList[i]!;
        for (const direction of this.directionNames(ctx)) {
          for (const between of stepsOf(site, direction)) {
            if (enclosedGroup[between]) continue;

            if (isTarget(between)) {
              enclosedGroup[between] = true;
              enclosedGroupList.push(between);
            } else if (cs.whatAtSite(between) === 0) {
              if (numExceptionToUse > 0) {
                enclosedGroup[between] = true;
                enclosedGroupList.push(between);
                numExceptionToUse--;
              } else {
                // Liberty found — group is not enclosed
                continue aroundTargetLoop;
              }
            }
          }
        }

        sitesChecked[site] = true;
        i++;
      }

      // @java Enclose.java:237-258 — check for liberties in the full group and
      // collect the enclosing boundary.
      const enclosingGroup: number[] = [];
      for (const siteGroup of enclosedGroupList) {
        for (const direction of this.directionNames(ctx)) {
          for (const to of stepsOf(siteGroup, direction)) {
            if (!enclosedGroup[to] && !enclosingGroup.includes(to)) {
              // @java atLeastAnEmpty ? isTarget(to) : what(to)==0 — a liberty.
              if (atLeastAnEmpty ? isTarget(to) : cs.whatAtSite(to) === 0) {
                continue aroundTargetLoop;
              }
              enclosingGroup.push(to);
            }
          }
        }
      }

      // @java Enclose.java:260-290 — when the enclosed region may contain empty
      // sites, it is only truly enclosed if the surrounding boundary is a SINGLE
      // connected group (walk it via All-direction adjacency, consuming the list).
      if (atLeastAnEmpty && enclosingGroup.length > 0) {
        let aSingleGroup = true;
        const ring = [...enclosingGroup];
        let siteGroup = ring[0]!;
        while (ring.length !== 1) {
          let inSameGroup = false;
          for (const to of stepsOf(siteGroup, "All")) {
            if (ring.includes(to)) {
              const idx = ring.indexOf(siteGroup);
              if (idx >= 0) ring.splice(idx, 1);
              siteGroup = to;
              inSameGroup = true;
              break;
            }
          }
          if (!inSameGroup) {
            aSingleGroup = false;
            break;
          }
        }
        if (!aSingleGroup) continue aroundTargetLoop;
      }

      // @java Enclose.java:298-304 — group is enclosed, apply effect to each member
      for (const between of enclosedGroupList) {
        ctx._evalBetween = between;
        const effectMoves = this.effect.eval(ctx);
        allMoves.push(...effectMoves.map(m => {
          // Ensure mover is set
          if (m.mover !== mover) {
            return new LudiiMove({
              id: m.id,
              label: m.label,
              siteIndices: [...m.siteIndices],
              mover,
              placedOwner: mover,
              actions: [...m.actions],
              deferredThens: m.deferredThens,
              moveAgain: m.moveAgain,
            });
          }
          return m;
        }));
      }
    }

    ctx._evalTo = origTo;
    ctx._evalBetween = origBetween;

    // @java Enclose.java:311-313 — then clause. Move.apply evaluates then()
    // AFTER the action, and the consequence reads the post-enclose board (the
    // captured pieces), so defer instead of baking the pre-move eval.
    if (this.thenClause != null) {
      return allMoves.map(m => applyPostStateThen(this.thenClause, ctx, m));
    }

    return allMoves;
  }

  private directionNames(ctx: Context): string[] {
    return typeof this.dirnChoice === "string" ? [this.dirnChoice] : this.dirnChoice.eval(ctx);
  }
}

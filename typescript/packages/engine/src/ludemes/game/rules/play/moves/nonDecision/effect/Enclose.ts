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
import type { SiteType } from "../../../../../../../action/site-type.js";
import type { From } from "../../../../../util/moves/From.js";
import type { Between } from "../../../../../util/moves/Between.js";
import { Who } from "../../../../../functions/ints/state/Who.js";
import type { JavaIntFunction } from "../../../../../functions/ints/IntFunction.js";
import { IsEnemy } from "../../../../../functions/booleans/is/player1to1/IsEnemy.js";
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

    const topology = ctxAny.topology;
    if (!topology) {
      throw new Error("not yet wired: Enclose requires topology on Context");
    }

    const realType = this.type ?? ctxAny._siteType ?? "Cell";
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

    const aroundTarget: number[] = [];
    const trajectories = topology.trajectories();
    for (const direction of this.directionNames(ctx)) {
      const steps = trajectories.steps(realType, from, realType, direction);
      for (const step of steps) {
        const between = step.to.id();
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
          const siteSteps = trajectories.steps(realType, site, realType, direction);

          for (const step of siteSteps) {
            const between = step.to.id();
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

      // @java Enclose.java:237-258 — check for liberties in the full group
      for (const siteGroup of enclosedGroupList) {
        for (const direction of this.directionNames(ctx)) {
          const groupSteps = trajectories.steps(realType, siteGroup, realType, direction);
          for (const step of groupSteps) {
            const to = step.to.id();
            if (!enclosedGroup[to] && cs.whatAtSite(to) === 0) {
              // Liberty — this group is not fully enclosed
              continue aroundTargetLoop;
            }
          }
        }
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
            });
          }
          return m;
        }));
      }
    }

    ctx._evalTo = origTo;
    ctx._evalBetween = origBetween;

    // @java Enclose.java:311-313 — then clause
    if (this.thenClause != null) {
      const thenMoves = this.thenClause.eval(ctx);
      return allMoves.map(m => m.withConsequence(
        thenMoves.flatMap(tm => [...tm.actions]),
        false,
      ));
    }

    return allMoves;
  }

  private directionNames(ctx: Context): string[] {
    return typeof this.dirnChoice === "string" ? [this.dirnChoice] : this.dirnChoice.eval(ctx);
  }
}

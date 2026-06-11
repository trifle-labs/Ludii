// @java Core/src/game/rules/play/moves/nonDecision/effect/Hop.java

/**
 * Defines a hop in which a piece hops over a hurdle (the pivot) in a direction.
 *
 * @java game/rules/play/moves/nonDecision/effect/Hop.java
 *
 * Java: public final class Hop extends Effect
 *   - startLocationFn: IntFunction — from location (default: from)
 *   - dirnChoice: DirectionsFunction — directions (default: Adjacent)
 *   - goRule: BooleanFunction — condition on the landing site
 *   - hurdleRule: BooleanFunction — condition identifying the hurdle (default: true)
 *   - stopRule: BooleanFunction | null — stop condition (from to.effect)
 *   - stopEffect: Moves | null — effect when stop condition is met
 *   - maxDistanceFromHurdleFn: IntFunction — max gap between from and hurdle (default 0)
 *   - minLengthHurdleFn: IntFunction — minimum hurdle length (default 1)
 *   - maxLengthHurdleFn: IntFunction — maximum hurdle length (default 1)
 *   - maxDistanceHurdleToFn: IntFunction — max gap between hurdle and to (default 0)
 *   - sideEffect: Moves | null — effect applied on hurdle piece(s)
 *   - stack: boolean — move whole stack (default false)
 *
 * eval(): walks radials from `from`, identifies hurdle pieces, generates landing
 * moves past the hurdle, applying side-effects on hurdle pieces as needed.
 */

import type { Context } from "../../../../../../../context.js";
import { radialsForDirection, type CellFlatRadials } from "../../../../../../topology-radials.js";
import type { Trajectories } from "../../../../../../../eval/graph/trajectories.js";
import { Move } from "../../../../../../../move.js";
import { ActionMove } from "../../../../../../../action/action-move.js";
import type { BooleanFunction, DirectionsFunction, IntFunction, MovesFunction } from "../../../../../../base.js";
import { Effect } from "./Effect.js";
import { applyPostStateThen } from "./Then.js";
import { resolveRelativeDir, isSingleDir, resolveSameOppositeDir } from "../../../../../util/directions/RelativeDirection.js";
import type { ThenLike } from "../../Moves.js";
import type { Action } from "../../../../../../../action/index.js";

// @java topology.supportedDirections(RelationType.Adjacent, graphType) — the
// direction names this board actually supports (rotated hex: ENE/WNW/...).
function supportedDirNames(ctx: unknown): string[] | undefined {
  const topo = (ctx as { topology?: () => { supportedDirections?: (rel: string, t: string) => Array<{ toAbsolute?: () => string } | string> } }).topology?.();
  const raw = topo?.supportedDirections?.("Adjacent", "Cell");
  if (!raw || raw.length === 0) return undefined;
  return raw.map((d) => (typeof d === "string" ? d : d.toAbsolute?.() ?? "")).filter((n) => n.length > 0);
}


/**
 * Hop effect — piece hops over a hurdle.
 *
 * @java game/rules/play/moves/nonDecision/effect/Hop.java
 */
export class Hop extends Effect {
  /** @java Hop.startLocationFn */
  private readonly startLocationFn: IntFunction;

  /** @java Hop.dirnChoice */
  private readonly dirnChoice: DirectionsFunction;

  /** @java Hop.goRule — condition on landing site */
  private readonly goRule: BooleanFunction;

  /** @java Hop.hurdleRule — condition identifying the hurdle */
  private readonly hurdleRule: BooleanFunction;

  /** @java Hop.stopRule */
  private readonly stopRule: BooleanFunction | null;

  /** @java Hop.stopEffect */
  private readonly stopEffect: MovesFunction | null;

  /** @java Hop.maxDistanceFromHurdleFn */
  private readonly maxDistanceFromHurdleFn: IntFunction;

  /** @java Hop.minLengthHurdleFn */
  private readonly minLengthHurdleFn: IntFunction;

  /** @java Hop.maxLengthHurdleFn */
  private readonly maxLengthHurdleFn: IntFunction;

  /** @java Hop.maxDistanceHurdleToFn */
  private readonly maxDistanceHurdleToFn: IntFunction;

  /** @java Hop.sideEffect — effect on hurdle piece(s) */
  private readonly sideEffect: MovesFunction | null;

  /** @java Hop.fromCondition */
  private readonly fromCondition: BooleanFunction | null;

  /** @java Hop.stack */
  private readonly stack: boolean;

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Hop.java — constructor
   */
  public constructor(opts: {
    startLocationFn: IntFunction;
    dirnChoice: DirectionsFunction;
    goRule: BooleanFunction;
    hurdleRule: BooleanFunction;
    stopRule?: BooleanFunction | null;
    stopEffect?: MovesFunction | null;
    maxDistanceFromHurdleFn: IntFunction;
    minLengthHurdleFn: IntFunction;
    maxLengthHurdleFn: IntFunction;
    maxDistanceHurdleToFn: IntFunction;
    sideEffect?: MovesFunction | null;
    fromCondition?: BooleanFunction | null;
    stack?: boolean;
    then?: ThenLike | null;
  }) {
    super(opts.then ?? null);
    // compileTerminal hands BooleanFunction slots raw booleans for the lud
    // literals True/False (Chaturanga: `(between if:True)`) — wrap them.
    // @java BooleanConstant
    const wrapB = <T extends BooleanFunction | null | undefined>(b: T | boolean): T =>
      (typeof (b as unknown) === "boolean" ? ({ eval: () => b as unknown as boolean } as unknown as T) : (b as T));
    this.startLocationFn = opts.startLocationFn;
    this.dirnChoice = opts.dirnChoice;
    this.goRule = wrapB(opts.goRule);
    this.hurdleRule = wrapB(opts.hurdleRule);
    this.stopRule = wrapB(opts.stopRule ?? null);
    this.stopEffect = opts.stopEffect ?? null;
    this.maxDistanceFromHurdleFn = opts.maxDistanceFromHurdleFn;
    this.minLengthHurdleFn = opts.minLengthHurdleFn;
    this.maxLengthHurdleFn = opts.maxLengthHurdleFn;
    this.maxDistanceHurdleToFn = opts.maxDistanceHurdleToFn;
    this.sideEffect = opts.sideEffect ?? null;
    this.fromCondition = wrapB(opts.fromCondition ?? null);
    this.stack = opts.stack ?? false;
  }

  // -------------------------------------------------------------------------

  /**
   * Resolve this Hop's direction choice to full rays from `from`.
   *
   * This mirrors Step's direction/radial path: relative directions are converted
   * through the mover's facing, single compass directions use one ray only, and
   * group directions walk both halves of each distinct axis.
   */
  private hopRays(ctx: Context, from: number, cellRadials: CellFlatRadials): readonly (readonly number[])[] {
    const directions = this.dirnChoice.eval(ctx);
    const mover = ctx.state.mover;
    const playerDirs = (ctx.game as unknown as { _playerDirs?: Map<number, number> })._playerDirs;
    // Dual-SiteType: route through the iterated position's element-type view
    // (local only — never mutate ctx._trajectories).
    const baseTrajH = (ctx as unknown as { _trajectories?: Trajectories | null })._trajectories ?? null;
    const playTypeNameH = (ctx as unknown as { board?: () => { defaultSite?: () => string } }).board?.()?.defaultSite?.() ?? null;
    const rawTagH = (ctx as unknown as { _evalFromType?: string | null })._evalFromType ?? null;
    const fromTypeTagH = rawTagH && playTypeNameH && rawTagH !== playTypeNameH ? rawTagH : null;
    const traj = fromTypeTagH && baseTrajH && typeof (baseTrajH as unknown as { viewOf?: unknown }).viewOf === "function"
      ? (baseTrajH as unknown as { viewOf(k: string): Trajectories }).viewOf(fromTypeTagH)
      : baseTrajH;

    const GROUP_DIRS = new Set(["adjacent", "orthogonal", "diagonal", "all"]);
    const axesForDir = (dir: string): readonly { ray: readonly number[]; opposite: readonly number[] }[] => {
      if (traj) {
        const distinct = traj.distinctRadialsByName(from, dir);
        if (distinct.length > 0) {
          return distinct.map((radial) => ({
            ray: radial.ray,
            opposite: radial.opposites[0] ?? [from],
          }));
        }
        if (!GROUP_DIRS.has(dir.toLowerCase())) return [];
      }
      return radialsForDirection(cellRadials, dir);
    };

    const out: (readonly number[])[] = [];
    const seen = new Set<string>();
    const pushRay = (ray: readonly number[]): void => {
      if (ray.length < 2) return;
      const key = ray.join(",");
      if (seen.has(key)) return;
      seen.add(key);
      out.push(ray);
    };

    for (const rawDirName of directions) {
      // @java Directions.java:498 — SameDirection/OppositeDirection resolve to the
      // absolute compass of the LAST move (Konane's continuation hops:
      // ("HopCapture" (from (last To)) SameDirection)).
      let dirName = rawDirName;
      if (rawDirName === "SameDirection" || rawDirName === "OppositeDirection") {
        const resolved = resolveSameOppositeDir(
          ctx as unknown as Parameters<typeof resolveSameOppositeDir>[0],
          rawDirName === "OppositeDirection",
        );
        if (resolved === null) continue;
        dirName = resolved;
      }
      const relative = resolveRelativeDir(dirName, mover, playerDirs, undefined, supportedDirNames(ctx));
      if (Array.isArray(relative)) {
        for (const dir of relative) {
          for (const { ray } of axesForDir(dir)) pushRay(ray);
        }
        continue;
      }

      const effDir = relative ?? dirName;
      const single = isSingleDir(effDir);
      for (const { ray, opposite } of axesForDir(effDir)) {
        pushRay(ray);
        if (!single) pushRay(opposite);
      }
    }

    return out;
  }

  private buildMove(
    kind: string,
    from: number,
    to: number,
    mover: number,
    actions: Action[],
  ): Move {
    const moveAction = new ActionMove({ from, to });
    moveAction.setDecision(true);
    actions.push(moveAction);
    return new Move({
      id: `hop:${kind}:${mover}:${from}:${to}`,
      label: kind === "stop" ? `Hop(${from}→${to},stop)` : `Hop(${from}→${to})`,
      siteIndices: [from, to],
      mover,
      placedOwner: mover,
      actions,
    });
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Hop.java — eval(Context)
   *
   * Java lines 151-372:
   *   For each direction:
   *     1. If minLengthHurdle == 0: try stepping directly (goRule check).
   *     2. If maxLengthHurdle > 0: walk radials to find hurdles and land past them.
   *
   * TS transliteration uses _radials topology attachment.
   */
  public override eval(ctx: Context): Move[] {
    const from = this.startLocationFn.eval(ctx);
    if (from < 0) return [];

    const ctxAny = ctx as unknown as {
      _radials?: CellFlatRadials[];
    };
    const radials = ctxAny._radials;
    if (!radials) {
      throw new Error("not yet wired: Hop.eval requires _radials topology");
    }

    const state = ctx.state;
    const mover = state.mover;

    const origFrom = (ctx as unknown as { _evalFrom?: number })._evalFrom ?? -1;
    const origTo = (ctx as unknown as { _evalTo?: number })._evalTo ?? -1;
    const origBetween = (ctx as unknown as { _evalBetween?: number })._evalBetween ?? -1;

    const maxDistanceFromHurdle = this.maxDistanceFromHurdleFn.eval(ctx);
    const minLengthHurdle = this.minLengthHurdleFn.eval(ctx);
    const maxLengthHurdle = this.maxLengthHurdleFn === this.minLengthHurdleFn
      ? minLengthHurdle
      : this.maxLengthHurdleFn.eval(ctx);
    const maxDistanceHurdleTo = this.maxDistanceHurdleToFn.eval(ctx);

    (ctx as unknown as { _evalFrom?: number })._evalFrom = from;

    // @java Hop.java:178 — from condition check
    if (this.fromCondition !== null && !this.fromCondition.eval(ctx)) {
      (ctx as unknown as { _evalFrom?: number })._evalFrom = origFrom;
      (ctx as unknown as { _evalTo?: number })._evalTo = origTo;
      (ctx as unknown as { _evalBetween?: number })._evalBetween = origBetween;
      return [];
    }

    const cellRadials = radials[from];
    if (!cellRadials) {
      (ctx as unknown as { _evalTo?: number })._evalTo = origTo;
      (ctx as unknown as { _evalFrom?: number })._evalFrom = origFrom;
      (ctx as unknown as { _evalBetween?: number })._evalBetween = origBetween;
      return [];
    }
    const rays = this.hopRays(ctx, from, cellRadials);

    const result: Move[] = [];
    const seen = new Set<string>();

    // @java Hop.java:180-228 — Step if minLengthHurdle == 0
    if (minLengthHurdle === 0) {
      for (const ray of rays) {
          if (ray.length < 2) continue;
          const to = ray[1]!;
          (ctx as unknown as { _evalTo?: number })._evalTo = to;
          if (!this.goRule.eval(ctx)) continue;
          const key = `${from}:${to}`;
          if (!seen.has(key)) {
            seen.add(key);
            const actions: Action[] = [];
            if (this.sideEffect !== null) {
              const sideActions = this.sideEffect.eval(ctx);
              for (const sm of sideActions) for (const a of sm.actions) {
              (a as { setDecision?: (d: boolean) => void }).setDecision?.(false);
              actions.push(a);
            }
            }
            result.push(this.buildMove("step", from, to, mover, actions));
          }
      }
    }

    // @java Hop.java:232-363 — Hop over hurdle if maxLengthHurdle > 0
    if (maxLengthHurdle > 0) {
      for (const ray of rays) {
          for (let toIdx = 1; toIdx < ray.length; toIdx++) {
            const between = ray[toIdx]!;
            (ctx as unknown as { _evalBetween?: number })._evalBetween = between;

            if (this.hurdleRule.eval(ctx)) {
              // Found a hurdle — build the hurdle list
              const hurdleLocs: number[] = [between];
              let lengthHurdle = 1;
              let hurdleIdx = toIdx + 1;
              let hurdleWrong = false;

              for (; hurdleIdx < ray.length && lengthHurdle < maxLengthHurdle; hurdleIdx++) {
                const hurdleLoc = ray[hurdleIdx]!;
                (ctx as unknown as { _evalBetween?: number })._evalBetween = hurdleLoc;
                if (!this.hurdleRule.eval(ctx)) {
                  hurdleWrong = true;
                  break;
                }
                hurdleLocs.push(hurdleLoc);
                lengthHurdle++;
              }

              if (lengthHurdle < minLengthHurdle || (hurdleWrong && lengthHurdle === maxLengthHurdle)) break;

              // Try landing sites after the hurdle
              for (let fromMinHurdle = lengthHurdle - minLengthHurdle; fromMinHurdle >= 0; fromMinHurdle--) {
                let afterHurdleToIdx = hurdleIdx - fromMinHurdle;
                for (; afterHurdleToIdx < ray.length; afterHurdleToIdx++) {
                  const afterHurdleTo = ray[afterHurdleToIdx]!;
                  (ctx as unknown as { _evalTo?: number })._evalTo = afterHurdleTo;

                  if (!this.goRule.eval(ctx)) {
                    // @java: check stopRule
                    if (this.stopRule !== null && this.stopRule.eval(ctx)) {
                      const key = `${from}:${afterHurdleTo}`;
                      if (!seen.has(key)) {
                        seen.add(key);
                        const actions: Action[] = [];
                        if (this.stopEffect !== null) {
                          const stopMoves = this.stopEffect.eval(ctx);
                          for (const sm of stopMoves) for (const a of sm.actions) {
              (a as { setDecision?: (d: boolean) => void }).setDecision?.(false);
              actions.push(a);
            }
                        }
                        result.push(this.buildMove("stop", from, afterHurdleTo, mover, actions));
                      }
                    }
                    break;
                  }

                  // @java: goRule passed — valid landing
                  const key = `${from}:${afterHurdleTo}`;
                  if (!seen.has(key)) {
                    seen.add(key);
                    const actions: Action[] = [];

                    // Apply sideEffect on hurdle pieces
                    for (let hi = 0; hi < hurdleLocs.length - fromMinHurdle; hi++) {
                      const hurdleLoc = hurdleLocs[hi]!;
                      (ctx as unknown as { _evalBetween?: number })._evalBetween = hurdleLoc;
                      if (this.sideEffect !== null) {
                        const sideMoves = this.sideEffect.eval(ctx);
                        for (const sm of sideMoves) for (const a of sm.actions) {
              (a as { setDecision?: (d: boolean) => void }).setDecision?.(false);
              actions.push(a);
            }
                      }
                    }

                    if (this.stopEffect !== null) {
                      const stopMoves = this.stopEffect.eval(ctx);
                      for (const sm of stopMoves) for (const a of sm.actions) {
              (a as { setDecision?: (d: boolean) => void }).setDecision?.(false);
              actions.push(a);
            }
                    }

                    result.push(this.buildMove("jump", from, afterHurdleTo, mover, actions));
                  }

                  // @java: check distance limit
                  if ((afterHurdleToIdx - hurdleIdx + 1) > (maxDistanceHurdleTo - fromMinHurdle)) break;
                }
              }
              break;
            }

            // @java Hop.java:357-359 — check gap from from to hurdle
            (ctx as unknown as { _evalTo?: number })._evalTo = between;
            if (toIdx > maxDistanceFromHurdle || !this.goRule.eval(ctx)) break;
          }
      }
    }

    // Restore context scratch
    (ctx as unknown as { _evalTo?: number })._evalTo = origTo;
    (ctx as unknown as { _evalFrom?: number })._evalFrom = origFrom;
    (ctx as unknown as { _evalBetween?: number })._evalBetween = origBetween;

    // @java Then.java — consequence evaluated in the POST-MOVE context (hop-chain
    // continuations like (then (if (can Move (hop ...)) (moveAgain))) must see the
    // just-applied hop).
    const thenClause = this.then();
    if (thenClause != null) {
      return result.map((m) => applyPostStateThen(thenClause, ctx, m));
    }
    return result;
  }

  // -------------------------------------------------------------------------

  /** @java Hop.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}

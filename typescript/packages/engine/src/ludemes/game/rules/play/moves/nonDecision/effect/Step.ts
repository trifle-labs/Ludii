// @java Core/src/game/rules/play/moves/nonDecision/effect/Step.java

/**
 * Moves to a connected site.
 *
 * @java game/rules/play/moves/nonDecision/effect/Step.java
 *
 * Java: public final class Step extends Effect
 *   - startLocationFn: IntFunction — from location (default: from)
 *   - fromCondition: BooleanFunction | null
 *   - startRegionFn: RegionFunction | null
 *   - levelFromFn: IntFunction | null
 *   - rule: BooleanFunction — condition on to-site (default: true)
 *   - sideEffect: Moves | null — effect applied at destination
 *   - stack: boolean — move whole stack (default false)
 *   - dirnChoice: DirectionsFunction — directions (default: Adjacent)
 *
 * eval(): for each direction step from the from-site, generates an ActionMove
 * if `rule` is satisfied, chaining any side effects.
 */

import type { Context } from "../../../../../../../context.js";
import { Move } from "../../../../../../../move.js";
import { ActionMove } from "../../../../../../../action/action-move.js";
import type { BooleanFunction, DirectionsFunction, IntFunction, MovesFunction, RegionFunction } from "../../../../../../base.js";
import { Effect } from "./Effect.js";
import type { ThenLike } from "../../Moves.js";
import type { Action } from "../../../../../../../action/index.js";

/**
 * Step effect — single-step move to adjacent cell.
 *
 * @java game/rules/play/moves/nonDecision/effect/Step.java
 */
export class Step extends Effect {
  /** @java Step.startLocationFn */
  private readonly startLocationFn: IntFunction;

  /** @java Step.fromCondition */
  private readonly fromCondition: BooleanFunction | null;

  /** @java Step.startRegionFn */
  private readonly startRegionFn: RegionFunction | null;

  /** @java Step.levelFromFn */
  private readonly levelFromFn: IntFunction | null;

  /** @java Step.rule — condition on to-site */
  private readonly rule: BooleanFunction;

  /** @java Step.sideEffect — effect on destination */
  private readonly sideEffect: MovesFunction | null;

  /** @java Step.stack */
  private readonly stack: boolean;

  /** @java Step.dirnChoice */
  private readonly dirnChoice: DirectionsFunction;

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Step.java — constructor
   */
  public constructor(opts: {
    startLocationFn: IntFunction;
    fromCondition?: BooleanFunction | null;
    startRegionFn?: RegionFunction | null;
    levelFromFn?: IntFunction | null;
    rule: BooleanFunction;
    sideEffect?: MovesFunction | null;
    stack?: boolean;
    dirnChoice: DirectionsFunction;
    then?: ThenLike | null;
  }) {
    super(opts.then ?? null);
    this.startLocationFn = opts.startLocationFn;
    this.fromCondition = opts.fromCondition ?? null;
    this.startRegionFn = opts.startRegionFn ?? null;
    this.levelFromFn = opts.levelFromFn ?? null;
    this.rule = opts.rule;
    this.sideEffect = opts.sideEffect ?? null;
    this.stack = opts.stack ?? false;
    this.dirnChoice = opts.dirnChoice;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Step.java — eval(Context)
   *
   * Java lines 143-245:
   *   If startRegionFn != null: evalRegion.
   *   Otherwise: eval single from-site.
   *     For each direction step, check rule, emit ActionMove.
   */
  public override eval(ctx: Context): Move[] {
    if (this.startRegionFn !== null) return this.evalRegion(ctx);

    const from = this.startLocationFn.eval(ctx);
    if (from < 0) return [];

    const ctxAny = ctx as unknown as {
      _radials?: Array<Record<string, Array<{ ray: number[]; opposite: number[] }>>>;
    };
    const radials = ctxAny._radials;
    if (!radials) {
      throw new Error("not yet wired: Step.eval requires _radials topology");
    }

    const state = ctx.state;
    const mover = state.mover;

    const origFrom = (ctx as unknown as { _evalFrom?: number })._evalFrom ?? -1;
    const origTo = (ctx as unknown as { _evalTo?: number })._evalTo ?? -1;

    (ctx as unknown as { _evalFrom?: number })._evalFrom = from;

    // @java Step.java:178 — from condition
    if (this.fromCondition !== null && !this.fromCondition.eval(ctx)) {
      (ctx as unknown as { _evalFrom?: number })._evalFrom = origFrom;
      return [];
    }

    const directions = this.dirnChoice.eval(ctx);
    const cellRadials = radials[from];
    if (!cellRadials) return [];

    const result: Move[] = [];
    const seen = new Set<number>();

    for (const dirName of directions) {
      const dirsForCell = cellRadials[dirName] ?? [];
      for (const { ray, opposite } of dirsForCell) {
        // Step to ray[1] (one step in this direction)
        for (const stepArr of [ray, opposite]) {
          if (stepArr.length < 2) continue;
          const to = stepArr[1]!;
          if (seen.has(to)) continue;

          (ctx as unknown as { _evalTo?: number })._evalTo = to;
          if (!this.rule.eval(ctx)) continue;
          seen.add(to);

          const actions: Action[] = [];

          // @java Step.java:230 — chainRuleWithAction(sideEffect, ...)
          if (this.sideEffect !== null) {
            const sideMoves = this.sideEffect.eval(ctx);
            for (const sm of sideMoves) for (const a of sm.actions) actions.push(a);
          }
          actions.push(new ActionMove({ from, to }));

          result.push(new Move({
            id: `step:${mover}:${from}:${to}`,
            label: `Step(${from}→${to})`,
            siteIndices: [from, to],
            mover,
            placedOwner: mover,
            actions,
          }));
        }
      }
    }

    (ctx as unknown as { _evalTo?: number })._evalTo = origTo;
    (ctx as unknown as { _evalFrom?: number })._evalFrom = origFrom;

    return result;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Step.java — evalRegion(Context)
   *
   * Java lines 256-345: same as eval but iterates over a region of from-sites.
   */
  private evalRegion(ctx: Context): Move[] {
    if (this.startRegionFn === null) return [];

    const froms = this.startRegionFn.eval(ctx);
    if (froms.length === 0) return [];

    const ctxAny = ctx as unknown as {
      _radials?: Array<Record<string, Array<{ ray: number[]; opposite: number[] }>>>;
    };
    const radials = ctxAny._radials;
    if (!radials) {
      throw new Error("not yet wired: Step.evalRegion requires _radials topology");
    }

    const state = ctx.state;
    const mover = state.mover;

    const origFrom = (ctx as unknown as { _evalFrom?: number })._evalFrom ?? -1;
    const origTo = (ctx as unknown as { _evalTo?: number })._evalTo ?? -1;

    const result: Move[] = [];

    for (const from of froms) {
      if (from < 0) continue;

      const cellRadials = radials[from];
      if (!cellRadials) continue;

      (ctx as unknown as { _evalFrom?: number })._evalFrom = from;

      if (this.fromCondition !== null && !this.fromCondition.eval(ctx)) continue;

      const directions = this.dirnChoice.eval(ctx);
      const seen = new Set<number>();

      for (const dirName of directions) {
        const dirsForCell = cellRadials[dirName] ?? [];
        for (const { ray, opposite } of dirsForCell) {
          for (const stepArr of [ray, opposite]) {
            if (stepArr.length < 2) continue;
            const to = stepArr[1]!;
            if (seen.has(to)) continue;

            (ctx as unknown as { _evalTo?: number })._evalTo = to;
            if (!this.rule.eval(ctx)) continue;
            seen.add(to);

            const actions: Action[] = [];
            if (this.sideEffect !== null) {
              const sideMoves = this.sideEffect.eval(ctx);
              for (const sm of sideMoves) for (const a of sm.actions) actions.push(a);
            }
            actions.push(new ActionMove({ from, to }));

            result.push(new Move({
              id: `step:region:${mover}:${from}:${to}`,
              label: `Step(${from}→${to})`,
              siteIndices: [from, to],
              mover,
              placedOwner: mover,
              actions,
            }));
          }
        }
      }
    }

    (ctx as unknown as { _evalTo?: number })._evalTo = origTo;
    (ctx as unknown as { _evalFrom?: number })._evalFrom = origFrom;

    return result;
  }

  // -------------------------------------------------------------------------

  /** @java Step.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}

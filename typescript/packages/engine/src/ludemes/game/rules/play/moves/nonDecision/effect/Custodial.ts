// @java Core/src/game/rules/play/moves/nonDecision/effect/Custodial.java

/**
 * Is used to apply an effect to all the sites flanked between two sites.
 *
 * @java game/rules/play/moves/nonDecision/effect/Custodial.java
 *
 * Java: public final class Custodial extends Effect
 *   - startLocationFn: IntFunction — pivot/from location (default: lastTo)
 *   - dirnChoice: AbsoluteDirection — direction (default: Adjacent)
 *   - minimum: IntFunction — min path length to flank (default: 0)
 *   - limit: IntFunction — max path length to flank (default: MAX_DISTANCE)
 *   - targetRule: BooleanFunction — identifies flanked enemy pieces
 *   - friendRule: BooleanFunction — identifies the flanking friend pieces
 *   - targetEffect: Moves — effect to apply on flanked pieces
 *
 * eval(): for each radial from the pivot, finds runs of target pieces flanked
 * by friend pieces and applies targetEffect to each flanked piece.
 */

import type { Context } from "../../../../../../../context.js";
import { Move } from "../../../../../../../move.js";
import type { BooleanFunction, IntFunction, MovesFunction } from "../../../../../../base.js";
import { Effect } from "./Effect.js";
import type { ThenLike } from "../../Moves.js";
import type { Action } from "../../../../../../../action/index.js";

const MAX_DISTANCE = 1000;

/**
 * Custodial effect — tafl-style flanking capture.
 *
 * @java game/rules/play/moves/nonDecision/effect/Custodial.java
 */
export class Custodial extends Effect {
  /** @java Custodial.startLocationFn */
  private readonly startLocationFn: IntFunction;

  /** @java Custodial.dirnChoice */
  private readonly dirnChoice: string;

  /** @java Custodial.minimum */
  private readonly minimum: IntFunction;

  /** @java Custodial.limit */
  private readonly limit: IntFunction;

  /** @java Custodial.targetRule */
  private readonly targetRule: BooleanFunction;

  /** @java Custodial.friendRule */
  private readonly friendRule: BooleanFunction;

  /** @java Custodial.targetEffect */
  private readonly targetEffect: MovesFunction;

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Custodial.java — constructor
   */
  public constructor(opts: {
    startLocationFn: IntFunction;
    dirnChoice?: string;
    minimum: IntFunction;
    limit: IntFunction;
    targetRule: BooleanFunction;
    friendRule: BooleanFunction;
    targetEffect: MovesFunction;
    then?: ThenLike | null;
  }) {
    super(opts.then ?? null);
    this.startLocationFn = opts.startLocationFn;
    this.dirnChoice = opts.dirnChoice ?? "Adjacent";
    this.minimum = opts.minimum;
    this.limit = opts.limit;
    this.targetRule = opts.targetRule;
    this.friendRule = opts.friendRule;
    this.targetEffect = opts.targetEffect;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Custodial.java — eval(Context)
   *
   * Java lines 117-158:
   *   1. Resolve from, get radials.
   *   2. If maxPath == 1 && minPath < 2: shortSandwich.
   *   3. Else if maxPath > 1 && minPath <= maxPath: longSandwich.
   */
  public override eval(ctx: Context): Move[] {
    const from = this.startLocationFn.eval(ctx);
    if (from < 0) return [];

    const ctxAny = ctx as unknown as {
      _radials?: Array<Record<string, Array<{ ray: number[]; opposite: number[] }>>>;
    };
    const radials = ctxAny._radials;
    if (!radials) {
      throw new Error("not yet wired: Custodial.eval requires _radials topology");
    }

    const state = ctx.state;
    const mover = state.mover;

    const origFrom = (ctx as unknown as { _evalFrom?: number })._evalFrom ?? -1;
    const origTo = (ctx as unknown as { _evalTo?: number })._evalTo ?? -1;
    const origBetween = (ctx as unknown as { _evalBetween?: number })._evalBetween ?? -1;

    const minPathLength = this.minimum.eval(ctx);
    const maxPathLength = this.limit.eval(ctx);

    const cellRadials = radials[from];
    if (!cellRadials) return [];

    const axes = cellRadials[this.dirnChoice] ?? [];
    const result: Move[] = [];

    if (maxPathLength === 1 && minPathLength < 2) {
      this.shortSandwich(ctx, result, mover, axes);
    } else if (maxPathLength > 1 && minPathLength <= maxPathLength) {
      this.longSandwich(ctx, result, mover, axes, minPathLength, maxPathLength);
    }

    // Add then-consequences (coverage deferred)
    if (this.then() !== null) {
      // Java: for (j ...) moves.get(j).then().add(then().moves());
    }

    // Restore
    (ctx as unknown as { _evalBetween?: number })._evalBetween = origBetween;
    (ctx as unknown as { _evalTo?: number })._evalTo = origTo;
    (ctx as unknown as { _evalFrom?: number })._evalFrom = origFrom;

    return result;
  }

  /**
   * @java Custodial.shortSandwich — path length exactly 1.
   * Java lines 169-188:
   *   For each radial with at least 3 steps:
   *     between = steps[1], check isTarget
   *     friend = steps[2], check isFriend
   *     if both: apply targetEffect
   */
  private shortSandwich(
    ctx: Context,
    result: Move[],
    mover: number,
    axes: Array<{ ray: number[]; opposite: number[] }>,
  ): void {
    for (const { ray } of axes) {
      if (ray.length < 3) continue;
      const between = ray[1]!;
      if (!this.isTarget(ctx, between)) continue;
      if (!this.isFriend(ctx, ray[2]!)) continue;

      (ctx as unknown as { _evalBetween?: number })._evalBetween = between;
      const effMoves = this.targetEffect.eval(ctx);
      for (const em of effMoves) {
        result.push(new Move({
          id: `custodial:${mover}:${between}`,
          label: `Custodial(between=${between})`,
          siteIndices: [between],
          mover,
          placedOwner: mover,
          actions: [...em.actions] as Action[],
        }));
      }
    }
  }

  /**
   * @java Custodial.longSandwich — path length > 1.
   * Java lines 221-261.
   */
  private longSandwich(
    ctx: Context,
    result: Move[],
    mover: number,
    axes: Array<{ ray: number[]; opposite: number[] }>,
    minPathLength: number,
    maxPathLength: number,
  ): void {
    for (const { ray } of axes) {
      let foundEnemy = false;
      let posIdx = 1;

      // Walk ray finding target run
      while (posIdx < ray.length && posIdx <= maxPathLength) {
        if (!this.isTarget(ctx, ray[posIdx]!)) break;
        foundEnemy = true;
        posIdx++;
      }

      if (!foundEnemy || minPathLength >= posIdx) continue;

      // Check for friend at the end of the run
      const friendPos = posIdx < ray.length ? ray[posIdx]! : -1;
      if (!this.isFriend(ctx, friendPos)) continue;

      // Apply targetEffect to each flanked target
      for (let i = 1; i < posIdx; i++) {
        const between = ray[i]!;
        (ctx as unknown as { _evalBetween?: number })._evalBetween = between;
        const effMoves = this.targetEffect.eval(ctx);
        for (const em of effMoves) {
          result.push(new Move({
            id: `custodial:long:${mover}:${between}`,
            label: `Custodial(between=${between})`,
            siteIndices: [between],
            mover,
            placedOwner: mover,
            actions: [...em.actions] as Action[],
          }));
        }
      }
    }
  }

  private isTarget(ctx: Context, location: number): boolean {
    (ctx as unknown as { _evalBetween?: number })._evalBetween = location;
    return this.targetRule.eval(ctx);
  }

  private isFriend(ctx: Context, location: number): boolean {
    if (location < 0) return false;
    (ctx as unknown as { _evalTo?: number })._evalTo = location;
    return this.friendRule.eval(ctx);
  }

  // -------------------------------------------------------------------------

  /** @java Custodial.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}

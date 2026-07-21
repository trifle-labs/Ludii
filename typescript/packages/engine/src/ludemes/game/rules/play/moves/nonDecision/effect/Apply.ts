// @java Core/src/game/rules/play/moves/nonDecision/effect/Apply.java

/**
 * Returns the effect to apply only if the condition is satisfied.
 *
 * @java game/rules/play/moves/nonDecision/effect/Apply.java
 *
 * Java: public final class Apply extends Moves
 *   - cond: BooleanFunction — condition (may be null)
 *   - effect: NonDecision — effect moves to apply
 *
 * Three constructor forms:
 *   1. Apply(If) — condition only, null effect (checks condition only)
 *   2. Apply(effect) — no condition, always applies effect
 *   3. Apply(If, effect) — condition + effect
 */

import type { Context } from "../../../../../../../context.js";
import type { Move } from "../../../../../../../move.js";
import type { BooleanFunction, MovesFunction } from "../../../../../../base.js";
import { Moves } from "../../Moves.js";

/**
 * Conditional effect application: eval() applies the effect only if the
 * condition is null or evaluates to true.
 *
 * @java game/rules/play/moves/nonDecision/effect/Apply.java
 */
export class Apply extends Moves {
  /**
   * The condition to check. @java Apply.cond
   */
  public readonly cond: BooleanFunction | null;

  /**
   * The effect moves to apply if condition is satisfied. @java Apply.effect
   */
  public readonly effect: MovesFunction | null;

  // -------------------------------------------------------------------------

  /**
   * @java Apply(BooleanFunction If, NonDecision effect) — condition + effect form.
   * Pass null for cond to get Apply(effect) behaviour (always apply).
   * Pass null for effect to get Apply(If) behaviour (condition-only check).
   */
  public constructor(
    cond: BooleanFunction | null,
    effect: MovesFunction | null = null,
  ) {
    super(null);
    this.cond = cond;
    this.effect = effect;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Apply.java — eval(Context)
   *
   * Java lines 88-93:
   *   if (cond == null || cond.eval(context))
   *     return effect.eval(context);
   *   return new BaseMoves(super.then());
   */
  public override eval(ctx: Context): Move[] {
    if (this.cond === null || this.cond.eval(ctx)) {
      if (this.effect !== null)
        return this.effect.eval(ctx);
    }
    return [];
  }

  // -------------------------------------------------------------------------

  /**
   * @java Apply.canMove(Context)
   */
  public override canMove(ctx: Context): boolean {
    if (this.cond === null || this.cond.eval(ctx)) {
      if (this.effect !== null)
        return this.effect.eval(ctx).length > 0;
    }
    return false;
  }

  /**
   * @java Apply.canMoveTo(Context, int)
   */
  public override canMoveTo(ctx: Context, target: number): boolean {
    if (this.cond === null || this.cond.eval(ctx)) {
      if (this.effect !== null) {
        for (const m of this.effect.eval(ctx)) {
          if (m.siteIndices && m.siteIndices[m.siteIndices.length - 1] === target)
            return true;
        }
      }
    }
    return false;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Apply.isStatic()
   */
  public override isStatic(): boolean {
    if (this.cond !== null) return false;
    if (this.effect !== null) return false;
    return true;
  }

  /**
   * @java Apply.condition()
   */
  public condition(): BooleanFunction | null {
    return this.cond;
  }

  /**
   * @java Apply.effect()
   */
  public effectMoves(): MovesFunction | null {
    return this.effect;
  }
}

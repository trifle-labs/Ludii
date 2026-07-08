// @java Core/src/game/rules/play/moves/nonDecision/effect/set/value/SetPot.java

/**
 * Sets the pot value of the state.
 *
 * @java game/rules/play/moves/nonDecision/effect/set/value/SetPot.java
 *
 * Java parity (SetPot.eval):
 *   Creates a single move carrying ActionSetPot(value.eval(context)).
 *
 * NOTE: coverage-only transliteration; not registered in the 1:1 moves registry.
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { IntFunction, MovesFunction } from "../../../../../../../../base.js";
import { ActionSetPot } from "../../../../../../../../../action/action-set-pot.js";
import { Move as LudiiMove } from "../../../../../../../../../move.js";
import { applyPostStateThen } from "../../Then.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * @java game/rules/play/moves/nonDecision/effect/set/value/SetPot.java
 *
 * Sets the pot value of the game state.
 *
 * Java parity:
 *   public final class SetPot extends Effect
 *   eval(Context): create ActionSetPot(value) wrapped in a single Move.
 */
export class SetPot implements MovesFunction {
  /** The value to set the pot to. @java SetPot.value */
  private readonly valueFn: IntFunction;

  /** Optional subsequent moves. */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java SetPot(IntFunction value, Then then)
   * @param valueFn   Value to set the pot to (defaults to UNDEFINED = -1).
   * @param thenMoves Optional subsequent moves.
   */
  public constructor(
    valueFn: IntFunction | null = null,
    thenMoves: MovesFunction | null = null,
  ) {
    // Java parity: (value == null) ? new IntConstant(UNDEFINED) : value
    this.valueFn = valueFn ?? { eval: () => UNDEFINED };
    this.thenMoves = thenMoves;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/set/value/SetPot.java — eval(Context)
   *
   * Java parity (SetPot.eval lines 51-63):
   *   1. ActionSetPot(value.eval(context)).
   *   2. Wrap in a Move.
   *   3. Return the move list.
   */
  public eval(ctx: Context): Move[] {
    const mover = ctx.state.mover;
    const potValue = this.valueFn.eval(ctx);
    const action = new ActionSetPot(potValue);

    const move = new LudiiMove({
      id: "setPot",
      label: `setPot:${potValue}`,
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions: [action],
    });

    // @java Move.apply evaluates then() AFTER the action — defer, don't bake.
    return [applyPostStateThen(this.thenMoves, ctx, move)];
  }

  /** @java SetPot.isStatic() → false */
  public isStatic(): boolean {
    return false;
  }

  /** @java SetPot.toEnglish() */
  public toEnglish(): string {
    return "set the value of the pot";
  }
}

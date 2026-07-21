// @java Core/src/game/rules/play/moves/nonDecision/effect/set/value/SetCounter.java

/**
 * Sets the current counter of the game.
 *
 * @java game/rules/play/moves/nonDecision/effect/set/value/SetCounter.java
 * @author Eric.Piette
 *
 * @remarks The counter is incremented at each move, so to reinitialize it to 0
 *          at the next move, the counter has to be set at -1.
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { IntFunction, MovesFunction } from "../../../../../../../../base.js";
import { ActionSetCounter } from "../../../../../../../../../action/action-set-counter.js";
import { Move as LudiiMove } from "../../../../../../../../../move.js";
import { applyPostStateThen } from "../../Then.js";

/** @java Constants.UNDEFINED = -1 */
const UNDEFINED_VAL = -1;

/**
 * @java game/rules/play/moves/nonDecision/effect/set/value/SetCounter.java
 *
 * Sets the current counter of the game state.
 *
 * Java parity:
 *   public final class SetCounter extends Effect
 *   eval(Context): create ActionSetCounter(newValue.eval(context)) wrapped in a single Move.
 */
export class SetCounter implements MovesFunction {
  /**
   * New value for the counter.
   * @java SetCounter.newValue
   */
  private readonly newValue: IntFunction;

  /**
   * Optional subsequent moves.
   * @java Effect.then
   */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java SetCounter(IntFunction newValue, Then then)
   * @param newValue  The new counter value [-1 if null].
   * @param thenMoves Optional subsequent moves.
   */
  public constructor(
    newValue: IntFunction | null = null,
    thenMoves: MovesFunction | null = null,
  ) {
    // @java SetCounter.java:51 — this.newValue = (newValue == null) ? new IntConstant(-1) : newValue;
    this.newValue = newValue ?? { eval: () => UNDEFINED_VAL };
    this.thenMoves = thenMoves;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/set/value/SetCounter.java — eval(Context)
   *
   * Java parity (SetCounter.eval lines 57-68):
   *   1. new BaseMoves(super.then())
   *   2. ActionSetCounter(newValue.eval(context))
   *   3. new Move(actionSetCounter)
   *   4. moves.moves().add(move)
   *   5. setMovesLudeme(this) on each move (meta-tagging, no-op in TS)
   *   6. return moves
   */
  public eval(ctx: Context): Move[] {
    // @java SetCounter.java:59 — final Moves moves = new BaseMoves(super.then());
    const mover = ctx.state.mover;

    // @java SetCounter.java:60 — new ActionSetCounter(newValue.eval(context))
    const actionSetCounter = new ActionSetCounter(this.newValue.eval(ctx));

    // @java SetCounter.java:61 — new Move(actionSetCounter)
    const move = new LudiiMove({
      id: "setCounter",
      label: `setCounter:${actionSetCounter.value()}`,
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions: [actionSetCounter],
    });

    // @java SetCounter.java:65-66 — setMovesLudeme(this) on each move
    // (meta-tag only — no runtime effect in TS; skipped)

    // @java SetCounter.java:62 — moves.moves().add(move); Move.apply evaluates
    // then() AFTER the action applies. Baking thenMoves.eval(ctx) at generation
    // froze the consequence against the PRE-move state; applyPostStateThen
    // defers it to post-apply, matching Slide/Step/Leap.
    return [applyPostStateThen(this.thenMoves, ctx, move)];
  }

  /**
   * @java SetCounter.isStatic()
   * Returns whether the new value is static.
   */
  public isStatic(): boolean {
    // @java SetCounter.java:149-151 — return newValue.isStatic();
    return (this.newValue as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
  }

  /**
   * @java SetCounter.preprocess(Game)
   */
  public preprocess(game: unknown): void {
    // @java SetCounter.java:154-158 — super.preprocess(game); newValue.preprocess(game);
    (this.newValue as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
    if (this.thenMoves != null) {
      (this.thenMoves as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
    }
  }

  /**
   * @java SetCounter.gameFlags(Game)
   */
  public gameFlags(game: unknown): number {
    // @java SetCounter.java:74-82
    let flags = (this.newValue as unknown as { gameFlags?: (g: unknown) => number }).gameFlags?.(game) ?? 0;
    if (this.thenMoves != null) {
      flags |= (this.thenMoves as unknown as { gameFlags?: (g: unknown) => number }).gameFlags?.(game) ?? 0;
    }
    return flags;
  }

  /**
   * @java SetCounter.toString()
   */
  public toString(): string {
    return `SetCounter(${this.newValue})`;
  }

  /**
   * @java SetCounter.toEnglish(Game)
   */
  public toEnglish(game: unknown): string {
    let thenString = "";
    if (this.thenMoves != null) {
      thenString = " then " + ((this.thenMoves as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ?? "");
    }
    return `set the current counter of the game to ${this.newValue}${thenString}`;
  }
}

// @java Core/src/game/rules/play/moves/nonDecision/effect/state/remember/state/RememberState.java

/**
 * Stores the current state (for later avoidance via avoidStoredState).
 *
 * @java game/rules/play/moves/nonDecision/effect/state/remember/state/RememberState.java
 *
 * Java parity (RememberState.eval):
 *   Creates a single move carrying ActionStoreStateInContext.
 *   The move records the current state so that (avoidStoredState …) can
 *   later filter out positions that reproduce it.
 *
 * NOTE: coverage-only transliteration; not registered in the 1:1 moves registry.
 */

import type { Context } from "../../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../../../../base.js";
import { ActionStoreStateInContext } from "../../../../../../../../../../action/action-store-state.js";
import { Move as LudiiMove } from "../../../../../../../../../../move.js";
import { applyPostStateThen } from "../../../Then.js";

/**
 * @java game/rules/play/moves/nonDecision/effect/state/remember/state/RememberState.java
 *
 * Generates a single move that stores the current game state into the
 * context so that (avoidStoredState …) can detect repetitions later.
 *
 * Java parity: RememberState extends Effect; eval() creates one Move
 * wrapping ActionStoreStateInContext.
 */
export class RememberState implements MovesFunction {
  /**
   * Optional subsequent moves (the `then` clause).
   * @java Effect.then — may be null.
   */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java RememberState(Then then)
   * @param thenMoves  Optional subsequent moves applied after this one.
   */
  public constructor(thenMoves: MovesFunction | null = null) {
    this.thenMoves = thenMoves;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/state/remember/state/RememberState.java — eval(Context)
   *
   * Java parity (RememberState.eval lines 42-57):
   *   1. Create ActionStoreStateInContext.
   *   2. Wrap in a Move.
   *   3. Append thenMoves if present.
   *   4. Return the move list.
   */
  public eval(ctx: Context): Move[] {
    const mover = ctx.state.mover;
    const action = new ActionStoreStateInContext();

    const move = new LudiiMove({
      id: "rememberState",
      label: "rememberState",
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions: [action],
    });

    // @java Move.apply evaluates then() AFTER the action — defer, don't bake.
    return [applyPostStateThen(this.thenMoves, ctx, move)];
  }

  /** @java RememberState.isStatic() → true */
  public isStatic(): boolean {
    return true;
  }

  /** @java RememberState.toEnglish() */
  public toEnglish(): string {
    return "remember the current state";
  }
}

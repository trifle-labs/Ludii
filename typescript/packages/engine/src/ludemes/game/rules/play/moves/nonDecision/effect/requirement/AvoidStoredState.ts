// @java Core/src/game/rules/play/moves/nonDecision/effect/requirement/AvoidStoredState.java

/**
 * Filters legal moves to avoid reaching a previously stored state.
 *
 * @java game/rules/play/moves/nonDecision/effect/requirement/AvoidStoredState.java
 *
 * Java parity (AvoidStoredState.eval):
 *   For each candidate move, apply it to a TempContext and compare the
 *   resulting state hash to the stored-state hash; discard moves that
 *   reproduce the stored state.
 *
 * NOTE: coverage-only transliteration; not registered in the 1:1 moves registry.
 */

import { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../../base.js";

/**
 * @java game/rules/play/moves/nonDecision/effect/requirement/AvoidStoredState.java
 *
 * Filters the legal moves to prevent the game reaching a specific stored state.
 *
 * Java parity:
 *   public final class AvoidStoredState extends Effect
 *   eval(Context): apply each candidate move to a TempContext, reject those
 *     whose stateHash() equals the stored state hash.
 */
export class AvoidStoredState implements MovesFunction {
  /** The possible moves to filter. @java AvoidStoredState.moves */
  private readonly moves: MovesFunction;

  /** Optional subsequent moves (the `then` clause). */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java AvoidStoredState(Moves moves, Then then)
   *
   * @param moves      Moves to filter.
   * @param thenMoves  Optional subsequent moves applied after this (optional).
   */
  public constructor(moves: MovesFunction, thenMoves: MovesFunction | null = null) {
    this.moves = moves;
    this.thenMoves = thenMoves;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/requirement/AvoidStoredState.java — eval(Context)
   *
   * Java parity (AvoidStoredState.eval lines 51-77):
   *   1. Evaluate candidate moves.
   *   2. Get storedState from context.state().storedState().
   *   3. For each candidate, apply to TempContext and check stateHash().
   *   4. Keep only moves that produce a different hash.
   */
  public eval(ctx: Context): Move[] {
    const returnMoves: Move[] = [];
    const movesToEval = this.moves.eval(ctx);

    // Java parity: context.state().storedState() returns the hash stored by
    // a previous (rememberState) move. In the TS port we read it from the
    // state's storedState property (added by ActionStoreStateInContext).
    const stateAny = ctx.state as unknown as { storedState?: bigint | number };
    const storedStateHash = stateAny.storedState;

    for (const m of movesToEval) {
      const newState = m.applyTo(ctx.state);
      // Java parity: newContext.state().stateHash() != stateToCompare
      const newStateAny = newState as unknown as { stateHash?: bigint | number };
      const newHash = newStateAny.stateHash;

      // If we cannot compare (hashes unavailable), keep the move.
      if (storedStateHash === undefined || newHash === undefined) {
        returnMoves.push(m);
        continue;
      }

      if (newHash !== storedStateHash) {
        returnMoves.push(m);
      }
    }

    return returnMoves;
  }

  /** @java AvoidStoredState.isStatic() → delegates to moves.isStatic() */
  public isStatic(): boolean {
    return (this.moves as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
  }

  /** @java AvoidStoredState.toEnglish() */
  public toEnglish(): string {
    return "Filter the legal moves to avoid reaching a specific state";
  }
}

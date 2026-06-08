// @java Core/src/game/rules/play/moves/nonDecision/effect/set/suit/SetTrumpSuit.java

/**
 * Chooses a trump suit from a set of suits.
 *
 * @java game/rules/play/moves/nonDecision/effect/set/suit/SetTrumpSuit.java
 *
 * Java parity (SetTrumpSuit.eval):
 *   Evaluates the suit(s) from suitsFn, then for each suit:
 *     - Creates ActionSetTrumpSuit(suit).
 *     - Wraps it in a Move (with isDecision if this ludeme isDecision()).
 *
 * NOTE: coverage-only transliteration; not registered in the 1:1 moves registry.
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { IntArrayFunction, IntFunction, MovesFunction } from "../../../../../../../../base.js";
import { ActionSetTrumpSuit } from "../../../../../../../../../action/action-set-trump-suit.js";
import { Move as LudiiMove } from "../../../../../../../../../move.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * @java game/rules/play/moves/nonDecision/effect/set/suit/SetTrumpSuit.java
 *
 * Generates one Move per candidate trump suit.
 *
 * Java parity:
 *   public final class SetTrumpSuit extends Effect
 *   eval(Context): for each suit in suitsFn.eval(context), emit ActionSetTrumpSuit.
 */
export class SetTrumpSuit implements MovesFunction {
  /** All possible suits. @java SetTrumpSuit.suitsFn */
  private readonly suitsFn: IntArrayFunction;

  /** Optional subsequent moves. */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java SetTrumpSuit(IntFunction suit, Difference suits, Then then)
   *
   * @param suitFn    Function yielding a single suit.
   * @param suitsFn   Difference / IntArrayFunction yielding possible suits.
   * @param thenMoves Optional subsequent moves.
   */
  public constructor(
    suitFn: IntFunction | null,
    suitsFn: IntArrayFunction | null,
    thenMoves: MovesFunction | null = null,
  ) {
    const numNonNull = (suitFn !== null ? 1 : 0) + (suitsFn !== null ? 1 : 0);
    if (numNonNull !== 1) {
      throw new Error("Only one Or parameter must be non-null.");
    }

    this.suitsFn = suitsFn ?? { eval: (ctx) => [suitFn!.eval(ctx)] };
    this.thenMoves = thenMoves;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/set/suit/SetTrumpSuit.java — eval(Context)
   *
   * Java parity (SetTrumpSuit.eval lines 79-105):
   *   1. Evaluate the suits array.
   *   2. For each suit: create ActionSetTrumpSuit, wrap in a Move.
   *   3. Optionally set action.setDecision(true) if this is a decision ludeme.
   */
  public eval(ctx: Context): Move[] {
    const mover = ctx.state.mover;

    const suits = this.suitsFn.eval(ctx);

    const moves: Move[] = [];

    for (const suit of suits) {
      const action = new ActionSetTrumpSuit(suit);

      const move = new LudiiMove({
        id: "setTrumpSuit",
        label: `setTrumpSuit:${suit}`,
        siteIndices: [],
        mover,
        placedOwner: mover,
        actions: [action],
        fromSite: OFF,
        toSite: OFF,
      });

      const thenList: Move[] = this.thenMoves != null ? this.thenMoves.eval(ctx) : [];
      if (thenList.length === 0) {
        moves.push(move);
      } else {
        moves.push(
          new LudiiMove({
            id: "setTrumpSuit",
            label: `setTrumpSuit:${suit}`,
            siteIndices: [],
            mover,
            placedOwner: mover,
            actions: [action],
            then: thenList,
            fromSite: OFF,
            toSite: OFF,
          }),
        );
      }
    }

    return moves;
  }

  /** @java SetTrumpSuit.isStatic() → suitsFn.isStatic() */
  public isStatic(): boolean {
    return (this.suitsFn as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
  }

  /** @java SetTrumpSuit.toEnglish() */
  public toEnglish(): string {
    return "set trump suit";
  }
}

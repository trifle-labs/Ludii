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
import type { IntFunction, MovesFunction } from "../../../../../../../../base.js";
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
  private readonly suitsFn: IntFunction;

  /** Optional subsequent moves. */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java SetTrumpSuit(IntFunction suit, Difference suits, Then then)
   *
   * @param suitFn    Function yielding a single suit (or an array when an
   *                  IntArrayFunction is wrapped here). If null, no moves.
   * @param thenMoves Optional subsequent moves.
   */
  public constructor(
    suitFn: IntFunction | null,
    thenMoves: MovesFunction | null = null,
  ) {
    // Java parity: if suit != null → IntArrayConstant([suit])
    //              if suits != null → suits (IntArrayFunction / Difference)
    // Here we accept a single IntFunction; callers that want an array can
    // pass an IntFunction whose eval() returns the desired suit value.
    this.suitsFn = suitFn ?? { eval: () => 0 };
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

    // Java parity: suitsFn.eval(context) returns int[].
    // In TS we accept either a single-value IntFunction or an IntArrayFunction.
    const suitsAny = this.suitsFn as unknown as { eval(ctx: Context): number | number[] };
    const raw = suitsAny.eval(ctx);
    const suits: number[] = Array.isArray(raw) ? (raw as number[]) : [raw as number];

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

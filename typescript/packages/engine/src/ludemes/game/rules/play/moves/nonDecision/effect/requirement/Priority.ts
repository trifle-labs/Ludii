// @java Core/src/game/rules/play/moves/nonDecision/effect/requirement/Priority.java
/**
 * Returns the first list of moves with a non-empty set of moves.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/requirement/Priority.java
 *
 * @remarks To prioritise a list of legal moves over another. For example in
 *          some draughts games, if you can capture, you must capture, if not
 *          you can move normally.
 */

import type { Context } from "../../../../../../../../context.js";
import type { MovesFunction } from "../../../../../../../base.js";
import type { Move } from "../../../../../../../../move.js";
import type { Then } from "../Then.js";

export class Priority implements MovesFunction {
  /** @java Priority.list — the prioritised list of move sets */
  private readonly list: MovesFunction[];

  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/requirement/Priority.java — constructor(Moves[], Then)
   * @param list       Array of move-generating ludemes in priority order
   * @param thenClause Subsequent moves
   */
  public constructor(list: MovesFunction[], thenClause: Then | null = null) {
    this.list = list;
    this.thenClause = thenClause;
  }

  /**
   * Factory for the two-argument form (list1, list2).
   * @java Priority.java constructor(Moves, Moves, Then)
   */
  public static fromTwo(
    list1: MovesFunction,
    list2: MovesFunction,
    thenClause: Then | null = null,
  ): Priority {
    return new Priority([list1, list2], thenClause);
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/requirement/Priority.java — eval(Context)
   *
   * Evaluates each move set in order and returns the first non-empty result.
   * Appends then-clause to each returned move.
   */
  public eval(ctx: Context): Move[] {
    for (const moveGen of this.list) {
      // @java Priority.java:83-96 — evaluate each move set
      const moves = moveGen.eval(ctx);
      if (moves.length > 0) {
        // @java Priority.java:86-88 — append then clause if set
        if (this.thenClause != null) {
          const thenMoves = this.thenClause.eval(ctx);
          const thenActions = thenMoves.flatMap(tm => [...tm.actions]);
          return moves.map(m => m.withConsequence(thenActions, false));
        }
        return moves;
      }
    }

    // @java Priority.java:98 — all empty, return empty BaseMoves
    return [];
  }

  /**
   * @java Priority.java:103-109 — canMove check
   * Returns true if any list can move.
   */
  public canMove(ctx: Context): boolean {
    for (const moveGen of this.list) {
      if (moveGen.eval(ctx).length > 0) return true;
    }
    return false;
  }

  /** @java Priority.list() */
  public getList(): MovesFunction[] {
    return this.list;
  }
}

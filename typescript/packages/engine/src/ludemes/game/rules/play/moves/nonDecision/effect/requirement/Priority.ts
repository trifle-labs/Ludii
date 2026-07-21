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
import { applyPostStateThen, type Then } from "../Then.js";

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
  public constructor(
    list: MovesFunction[] | MovesFunction,
    list2OrThen: MovesFunction | Then | null = null,
    thenClause: Then | null = null,
  ) {
    if (Array.isArray(list)) {
      this.list = list;
      this.thenClause = (list2OrThen as Then | null) ?? null;
    } else {
      this.list = list2OrThen !== null && typeof (list2OrThen as MovesFunction).eval === "function"
        ? [list, list2OrThen as MovesFunction]
        : [list];
      this.thenClause = thenClause;
    }
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
        // @java Priority.java:86-88 — l.moves().get(j).then().add(then().moves()):
        // the then clause is DEFERRED onto each move and evaluated post-apply,
        // so (last To)/rotation/custom defines see the moved board. Evaluating
        // it eagerly here (pre-move) baked in the false-branch and hardcoded
        // moveAgain=false, advancing the turn when (then (if … (moveAgain)))
        // should have kept it (Gadis/Senet/Sokkattan).
        if (this.thenClause != null) {
          return moves.map(m => applyPostStateThen(this.thenClause!, ctx, m));
        }
        return moves;
      }
    }

    // @java Priority.java:98 — all empty, return empty BaseMoves
    return [];
  }

  /**
   * @java Priority.java:103-113 — canMove(Context)
   *
   * Java:
   *   for (final Moves moves : list) {
   *     if (moves.canMove(context)) return true;
   *   }
   *   return false;
   *
   * WAVE-16 LAZY-CANMOVE FIX: this used to call `moveGen.eval(ctx).length >
   * 0`, which forces a FULL eval() of the taken list entry even when that
   * entry is itself an Or/If/Priority whose OWN canMove() could resolve
   * lazily (stopping at the first sub-branch with a legal move, without
   * evaluating the rest). Delegating to the sub-node's polymorphic
   * `canMove()` (falling back to eval().length>0 only for leaf ludemes with
   * no override, exactly matching Java's own default Moves.canMove()
   * behaviour) restores the short-circuit chain end-to-end. See
   * MaxMoves.ts's canMove() for the same dispatch idiom already established
   * in this codebase.
   */
  public canMove(ctx: Context): boolean {
    for (const moveGen of this.list) {
      const fn = moveGen as unknown as { canMove?(c: Context): boolean; eval(c: Context): Move[] };
      const can = typeof fn.canMove === "function" ? fn.canMove(ctx) : fn.eval(ctx).length > 0;
      if (can) return true;
    }
    return false;
  }

  /** @java Priority.list() */
  public getList(): MovesFunction[] {
    return this.list;
  }
}

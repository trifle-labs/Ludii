// @java Core/src/other/playout/PlayoutMoveSelector.java PlayoutMoveSelector
/**
 * Faithful 1:1 transliteration of other.playout.PlayoutMoveSelector.
 *
 * Abstract base for objects that select moves during playouts (custom
 * playout strategies, potentially non-uniform).
 *
 * Java parity: other/playout/PlayoutMoveSelector.java
 */

import type { IMove } from "../context/Context.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IContext = any;

/**
 * @java public interface IsMoveReallyLegal
 */
export interface IsMoveReallyLegal {
  checkMove(move: IMove): boolean;
}

export abstract class PlayoutMoveSelector {

  // -------------------------------------------------------------------------

  /**
   * @java public abstract Move selectMove(context, maybeLegalMoves, p, isMoveReallyLegal)
   *
   * NOTE: this method is allowed to modify the maybeLegalMoves list.
   */
  abstract selectMove(
    context: IContext,
    maybeLegalMoves: IMove[],
    p: number,
    isMoveReallyLegal: IsMoveReallyLegal
  ): IMove | null;

  // -------------------------------------------------------------------------

  /**
   * @java public boolean wantsPlayUniformRandomMove() — default false
   */
  wantsPlayUniformRandomMove(): boolean { return false; }

  // -------------------------------------------------------------------------

  /**
   * @java public static Move selectUniformlyRandomMove(...)
   *
   * Selects a move uniformly at random while filtering out illegal ones.
   * NOTE: modifies the maybeLegalMoves array (removeSwap semantics).
   */
  static selectUniformlyRandomMove(
    _context: IContext,
    maybeLegalMoves: IMove[],
    isMoveReallyLegal: IsMoveReallyLegal,
    random: { nextInt(bound: number): number }
  ): IMove | null {
    while (maybeLegalMoves.length > 0) {
      const idx = random.nextInt(maybeLegalMoves.length);
      // removeSwap: swap with last, then pop
      const move: IMove = maybeLegalMoves[idx]!;
      maybeLegalMoves[idx] = maybeLegalMoves[maybeLegalMoves.length - 1]!;
      maybeLegalMoves.pop();

      if (isMoveReallyLegal.checkMove(move)) return move;
    }
    return null;
  }
}

// @java Core/src/other/move/MoveScore.java MoveScore
/**
 * Record of a move and its estimated score.
 *
 * Faithful 1:1 transliteration of other.move.MoveScore.
 *
 * @author cambolbro  (Java original)
 */

import type { LudiiMove } from "./LudiiMove.js";

/**
 * Pairs a move with a floating-point score estimate.
 * @java other.move.MoveScore
 */
export class MoveScore {
  private readonly _move:  LudiiMove;
  private readonly _score: number;

  /**
   * @java MoveScore(Move move, float score)
   */
  constructor(move: LudiiMove, score: number) {
    this._move  = move;
    this._score = score;
  }

  /** @java MoveScore#move() */
  move(): LudiiMove { return this._move; }

  /** @java MoveScore#score() */
  score(): number { return this._score; }

  toString(): string {
    return `${this._move.toString()} score:${this._score}`;
  }
}

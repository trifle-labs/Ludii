/**
 * @java game/rules/play/Play.java Play
 *
 * 1:1-port play-rules holder.
 *
 * Holds the move generator (the `(play ...)` expression).
 * @java game/rules/play/Play.java — moves()
 */

import type { MovesFunction } from "../../../base.js";

export class Play {
  /** The move generator. @java Play.moves() */
  public readonly moves: MovesFunction;

  /**
   * @java game/rules/play/Play.java — constructor
   */
  public constructor(moves: MovesFunction) {
    this.moves = moves;
  }
}

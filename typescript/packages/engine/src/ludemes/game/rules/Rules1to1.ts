/**
 * @java game/rules/Rules.java Rules
 *
 * 1:1-port rules holder.
 *
 * Holds the play rules and end rules for a game.
 * @java game/rules/Rules.java — play()/end()
 */

import type { Play1to1 } from "./play/Play1to1.js";
import type { End } from "./end/End.js";

export class Rules1to1 {
  /** The play rules. @java Rules.play() */
  public readonly play: Play1to1;
  /** The end rules. @java Rules.end() */
  public readonly end: End;

  /**
   * @java game/rules/Rules.java — constructor
   */
  public constructor(play: Play1to1, end: End) {
    this.play = play;
    this.end = end;
  }
}

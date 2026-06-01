/**
 * @java game/rules/Rules.java Rules
 *
 * 1:1-port rules holder.
 *
 * Holds either:
 *   (a) a bare play rule + end rule (no phases), or
 *   (b) an array of Phase objects + end rule (phases game).
 *
 * When phases are present, `play` is the play rule of phases[0] (for
 * backward-compat accessors); Game1to1 uses `phases` directly.
 *
 * @java game/rules/Rules.java — phases()/play()/end()
 */

import type { Play1to1 } from "./play/Play1to1.js";
import type { End } from "./end/End.js";
import type { Phase } from "./phase/Phase.js";

export class Rules1to1 {
  /** The play rules (bare form or phases[0].play). @java Rules.play() */
  public readonly play: Play1to1;
  /** The end rules. @java Rules.end() */
  public readonly end: End;
  /**
   * Phase list (null for bare-play games).
   * @java game/rules/Rules.java — phases field
   */
  public readonly phases: readonly Phase[] | null;

  /**
   * Bare-play constructor (no phases).
   * @java game/rules/Rules.java — Rules(play, end, null)
   */
  public constructor(play: Play1to1, end: End);
  /**
   * Phases constructor.
   * @java game/rules/Rules.java — Rules(null, end, phases)
   */
  public constructor(play: Play1to1, end: End, phases: Phase[] | null);
  public constructor(play: Play1to1, end: End, phases?: Phase[] | null) {
    this.play = play;
    this.end = end;
    this.phases = phases ?? null;
  }
}

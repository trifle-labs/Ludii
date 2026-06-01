/**
 * @java game/rules/phase/Phase.java
 *
 * Defines one phase of a game.
 *
 * A Phase holds:
 *   - name:        string label for this phase
 *   - play:        the move generator (Play1to1) for this phase
 *   - end:         optional per-phase end rule
 *   - nextPhases:  ordered list of NextPhase transition conditions
 *
 * @java game/rules/phase/Phase.java — Phase(name, role, mode, play, end, nextPhase, nextPhases)
 */

import type { Play1to1 } from "../play/Play1to1.js";
import type { End } from "../end/End.js";
import type { NextPhase } from "./NextPhase.js";

export class Phase {
  /** Name of the phase. @java Phase.name() */
  public readonly name: string;
  /** Move logic. @java Phase.play() */
  public readonly play: Play1to1;
  /** Per-phase end logic (optional). @java Phase.end() */
  public readonly end: End | null;
  /** Conditions to transition to another phase. @java Phase.nextPhase() */
  public readonly nextPhases: readonly NextPhase[];

  /**
   * @java game/rules/phase/Phase.java — constructor
   */
  public constructor(
    name: string,
    play: Play1to1,
    end: End | null = null,
    nextPhases: NextPhase[] = [],
  ) {
    this.name = name;
    this.play = play;
    this.end = end;
    this.nextPhases = nextPhases;
  }
}

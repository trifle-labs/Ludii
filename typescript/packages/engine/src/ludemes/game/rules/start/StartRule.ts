/**
 * StartRule interface for the 1:1 Java→TS port.
 *
 * A start rule modifies the initial state (cells[], whats[], countAt[])
 * before the game begins. Applied in order during Game1to1.start().
 *
 * @java game/rules/start/StartRule.java — start(Context)
 */

import type { Equipment1to1 } from "../../equipment/Equipment1to1.js";
import type { Context } from "../../../../context.js";

/**
 * A start-placement rule that modifies the initial state arrays.
 * This is called during game.start() to place pieces, fill hands, etc.
 *
 * @java game/rules/start/StartRule.java
 */
export interface StartRule {
  /**
   * Apply this start rule through the start-bridge Context.
   * @java game/rules/start/StartRule.java — eval(Context)
   *
   * Migrated rules implement THIS — the Java signature. The bridge context
   * (Game1to1.applyStartRule) carries placePieces, the board trajectories and
   * the ContainerState mutation facade (ctx._startState) until State convergence.
   */
  eval(context: Context): void;

}

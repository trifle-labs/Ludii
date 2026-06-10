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
   * the raw start arrays (ctx._startArrays) until State convergence.
   */
  eval?(context: Context): void;

  /**
   * TRANSITION surface — legacy raw-array mutation; deleted once every start
   * rule implements eval(Context).
   *
   * @param cells       cells[site] = owner (mutable)
   * @param whats       whats[site] = component index (mutable)
   * @param countAt     countAt[site] = piece count at site (mutable)
   * @param equipment   equipment for resolving piece names and hand sites
   * @param numPlayers  number of players
   * @param stateAt     stateAt[site] = per-site state value (mutable, optional)
   * @param valueAt     valueAt[site] = per-site value (mutable, optional)
   */
  applyToInitialState?(
    cells: number[],
    whats: number[],
    countAt: number[],
    equipment: Equipment1to1,
    numPlayers: number,
    stateAt?: number[],
    valueAt?: number[],
    context?: Context,
  ): void;
}

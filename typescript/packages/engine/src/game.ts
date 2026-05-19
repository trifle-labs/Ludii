/**
 * Java parity:
 * - Core/src/game/Game.java — only the subset the browser-player calls
 *   (start / apply / moves / over) plus a handful of Java-shape getters
 *   the engine reads through Context.
 */

import type { Context } from "./context.js";
import type { Move } from "./move.js";

export interface Game {
  readonly id: string;
  readonly name: string;
  readonly numPlayers: number;
  /** Board width in cells (1-cell-per-site grid). */
  readonly width: number;
  /** Board height in cells. */
  readonly height: number;
  /**
   * Total number of cells/sites on the board.
   * Java parity: `Game.numSites()`. Defaults to width × height.
   */
  readonly numSites: number;
  /** Optional human-readable description; Java parity: `Game.description()`. */
  readonly description?: string;
  start(): Context;
  moves(context: Context): readonly Move[];
  apply(context: Context, move: Move): Context;
  over(context: Context): boolean;
}

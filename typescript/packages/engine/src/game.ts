/**
 * Java parity:
 * - Core/src/game/Game.java — only the subset the browser-player calls
 *   (start / apply / moves / over).
 */

import type { Context } from "./context.js";
import type { Move } from "./move.js";

export interface Game {
  readonly id: string;
  readonly name: string;
  readonly numPlayers: number;
  start(): Context;
  moves(context: Context): readonly Move[];
  apply(context: Context, move: Move): Context;
  over(context: Context): boolean;
}

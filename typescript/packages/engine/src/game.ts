// @java Core/src/game/Game.java Game
/**
 * Java parity:
 * - Core/src/game/Game.java — only the subset the browser-player calls
 *   (start / apply / moves / over) plus a handful of Java-shape getters
 *   the engine reads through Context.
 */

import type { ConceptSet } from "./concept.js";
import type { Context } from "./context.js";
import type { Move } from "./move.js";
import type { SeededRng } from "./rng.js";

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
  /**
   * Build the initial context. `rng`, when supplied, seeds any stochastic start
   * rule (`(place Random …)`): the draw sequence is consumed from it so a replay
   * harness can reproduce Java's recorded initial placement by passing the
   * trial's RNG. Omitted for ordinary play (deterministic starts ignore it).
   */
  start(rng?: SeededRng): Context;
  moves(context: Context): readonly Move[];
  /**
   * The mover's *raw* legal moves — what the play rules generate, WITHOUT the
   * synthetic forced Pass that {@link moves} appends when a player has rolled
   * but cannot move. Java parity: `Phase.play().moves().eval()` /
   * `canMove()`, the path `computeStalemated` and `(no Moves …)` use, as
   * opposed to `Game.moves()` which routes through `Trial.setLegalMoves` and
   * adds the forced pass. Optional: implementations that never synthesise a
   * forced pass may omit it, and callers fall back to {@link moves}.
   */
  legalMovesRaw?(context: Context): readonly Move[];
  apply(context: Context, move: Move): Context;
  over(context: Context): boolean;
  /**
   * Java parity: `Game.concepts()` — the union of structural concepts
   * (e.g. AlternatingTurns, line/connection win) and the concepts of
   * the moves the game can emit. Optional; defaults to undefined when
   * a Game doesn't expose concept tracking.
   */
  concepts?(context?: Context): ConceptSet;
}

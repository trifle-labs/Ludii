/**
 * Java parity:
 * - Core/src/game/API.java — the interface the engine exposes to the
 *   browser-player. Only the deterministic-play subset is ported here;
 *   `playout(...)` is intentionally omitted until the AI surface lands.
 */

import type { Context } from "./context.js";
import type { Move } from "./move.js";

/**
 * Game API.
 *
 * Faithful port of `Core/src/game/API.java`. Two methods are deferred
 * from the Java original:
 * - `playout(...)` — depends on `AI`, `PlayoutMoveSelector`, RNG; the
 *   browser-player has no playout surface yet.
 * - `Moves moves(...)` — the Java return type is a `Moves` ludeme; the
 *   TS-side returns a readonly list of `Move` because the ludeme tree
 *   isn't ported yet.
 */
export interface API {
  /** Initialise the game graph and other relevant items. */
  create(): void;

  /** Start new instance of the game and return the initial context. */
  start(): Context;

  /** Legal turns from the current state. */
  moves(context: Context): readonly Move[];

  /**
   * Apply the specified move (i.e. game turn). Returns the next
   * context. Java parity: the Java method returns the move-as-applied;
   * here we return the next context because the TS engine is
   * context-immutable.
   */
  apply(context: Context, move: Move): Context;

  /** True once the trial is terminal. */
  over(context: Context): boolean;
}

/**
 * Games.ts
 *
 * @java game/match/Games.java
 *
 * Defines the games used in a match.
 *
 * Data/structure class — no eval(ctx), not registered in the 1:1 registry.
 */

import type { Subgame } from "./Subgame.js";

/**
 * Defines the games used in a match.
 * @java game/match/Games.java
 */
export class Games {
  /**
   * The games used in the match.
   * @java Games.games
   */
  private readonly _games: readonly Subgame[];

  /**
   * @java game/match/Games.java — constructor(@Or Subgame game, @Or Subgame[] games)
   * Accepts exactly one of a single subgame or an array.
   */
  public constructor(
    game: Subgame | null,
    games: readonly Subgame[] | null,
  ) {
    let numNonNull = 0;
    if (game !== null) numNonNull++;
    if (games !== null) numNonNull++;

    if (numNonNull !== 1) {
      throw new Error("Exactly one Or parameter must be non-null.");
    }

    if (game !== null) {
      this._games = [game];
      return;
    }

    if (games === null || games.length < 1) {
      throw new Error("A match needs at least one game.");
    }

    this._games = games.slice();
  }

  /**
   * @java Games.games() — returns the list of subgames
   */
  public games(): readonly Subgame[] {
    return this._games;
  }
}

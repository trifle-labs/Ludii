/**
 * Games1to1.ts
 *
 * @java game/match/Games.java
 *
 * Defines the games used in a match.
 *
 * Data/structure class — no eval(ctx), not registered in the 1:1 registry.
 */

import type { Subgame1to1 } from "./Subgame1to1.js";

/**
 * Defines the games used in a match.
 * @java game/match/Games.java
 */
export class Games1to1 {
  /**
   * The games used in the match.
   * @java Games.games
   */
  private readonly _games: readonly Subgame1to1[];

  /**
   * @java game/match/Games.java — constructor(@Or Subgame game, @Or Subgame[] games)
   * Accepts either a single subgame or an array.
   */
  public constructor(games: readonly Subgame1to1[]) {
    if (games.length < 1) {
      throw new Error("A match needs at least one game.");
    }
    this._games = games.slice();
  }

  /**
   * @java Games.games() — returns the list of subgames
   */
  public games(): readonly Subgame1to1[] {
    return this._games;
  }
}

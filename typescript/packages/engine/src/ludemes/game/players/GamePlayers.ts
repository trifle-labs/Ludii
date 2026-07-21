/**
 * GamePlayers.ts
 *
 * @java game/players/Players.java
 *
 * Defines the structural player roster of the game. Holds an array of
 * GamePlayer (slot 0 is null, 1..P are the real players).
 *
 * Named GamePlayers to avoid collision with the unrelated
 * game/functions/intArray/players/Players1to1.ts (which is an eval-ludeme
 * returning an array of matching player indices at runtime).
 *
 * Data/structure class — no eval(ctx), not registered in the 1:1 registry.
 */

import { GamePlayer } from "./GamePlayer.js";

/** Java constant: maximum player count. @java main/Constants.java — MAX_PLAYERS */
const MAX_PLAYERS = 32;

/**
 * Defines the players of the game.
 * @java game/players/Players.java
 */
export class GamePlayers {
  /**
   * Player records: slot 0 is null, player indices are 1..P.
   * @java Players.players
   */
  private readonly _players: Array<GamePlayer | null>;

  /**
   * Construct from an explicit array of Player objects.
   *
   * @java game/players/Players.java — constructor(Player[] players)
   */
  public static fromPlayerArray(players: GamePlayer[]): GamePlayers {
    return new GamePlayers(players);
  }

  /**
   * Construct from a player count (creates default players).
   *
   * @java game/players/Players.java — constructor(Integer numPlayers)
   */
  public static fromCount(numPlayers: number): GamePlayers {
    return new GamePlayers(numPlayers);
  }

  /**
   * @java game/players/Players.java — constructor(Player[] players)
   * @java game/players/Players.java — constructor(Integer numPlayers)
   */
  public constructor(players: GamePlayer[] | number) {
    // slot 0 is null (Java: players.add(null))
    this._players = [null];

    if (typeof players === "number") {
      const numPlayers = players;
      for (let p = 0; p < numPlayers; p++) {
        const player = new GamePlayer(null);
        if (player.name() === null) player.setName(`Player ${p + 1}`);
        player.setIndex(p + 1);
        player.setDefaultColour();
        player.setEnemies(numPlayers);
        this._players.push(player);
      }

      if (this._players.length > MAX_PLAYERS + 1) {
        throw new Error(`Too many players: ${this._players.length - 1}`);
      }

      if (numPlayers < 0) throw new Error(`Invalid player count: ${numPlayers}`);
      return;
    }

    for (let p = 0; p < players.length; p++) {
      const player = players[p]!;
      if (player.name() === null) player.setName(`Player ${p + 1}`);
      player.setIndex(p + 1);
      player.setDefaultColour();
      player.setEnemies(players.length);
      this._players.push(player);
    }

    if (this._players.length > MAX_PLAYERS + 1) {
      throw new Error(`Too many players: ${this._players.length - 1}`);
    }
  }

  /**
   * @java Players.count() — number of real players
   */
  public count(): number {
    return this._players.length - 1;
  }

  /**
   * @java Players.size() — total slots including null slot 0
   */
  public size(): number {
    return this._players.length;
  }

  /**
   * @java Players.players() — immutable list (slot 0 is null, 1..P are players)
   */
  public players(): ReadonlyArray<GamePlayer | null> {
    return this._players;
  }

  /**
   * Returns the player at the given 1-based index, or null for slot 0.
   */
  public get(index: number): GamePlayer | null {
    return this._players[index] ?? null;
  }
}

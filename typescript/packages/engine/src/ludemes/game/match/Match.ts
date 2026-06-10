/**
 * Match.ts
 *
 * @java game/match/Match.java
 *
 * Defines a match made up of a series of subgames.
 *
 * In the 1:1 port this is a data/structure class holding the subgame instances
 * and match-level end rules. Full match execution (advanceInstance, subcontext
 * playout) is handled by the runtime context layer and is out of scope for
 * this faithful structural port.
 *
 * Data/structure class — no eval(ctx), not registered in the 1:1 eval registry.
 */

import type { End } from "../rules/end/End.js";
import { GamePlayers } from "../players/GamePlayers.js";
import type { Games } from "./Games.js";
import type { Subgame } from "./Subgame.js";

/**
 * Defines a match made up of a series of subgames.
 *
 * @java game/match/Match.java
 */
export class Match {
  /** The name of the match. @java Match.name */
  public readonly name: string;

  /** The number of players. @java Match → Game.players().count() */
  public readonly numPlayers: number;

  /** Players record. @java Game.players */
  private readonly playersRecord: GamePlayers;

  /**
   * The subgame instances that make up the match.
   * @java Match.instances
   */
  private readonly _instances: readonly Subgame[];

  /**
   * The match-level end rules.
   * @java Match.end
   */
  public readonly end: End;

  /**
   * @java game/match/Match.java — constructor(String name, @Opt Players players, Games games, End end)
   * @java game/match/Match.java — hidden constructor(String name, Description gameDescription)
   *
   * Match has Java constructor arities 4 and 2; the faithful TS constructor
   * exposes the largest arity in Java positional order for ArgCompiler
   * new(...positionalArgs) instantiation.
   */
  public constructor(
    name: string,
    players: GamePlayers | null,
    games: Games,
    end: End,
  ) {
    const instances = games.games();
    if (instances.length === 0) {
      throw new Error("A match needs at least one game.");
    }
    this.name = name;
    this.playersRecord = players ?? GamePlayers.fromCount(2);
    this.numPlayers = this.playersRecord.count();
    this._instances = instances.slice();
    this.end = end;
  }

  /**
   * @java Game.players()
   */
  public players(): GamePlayers {
    return this.playersRecord;
  }

  /**
   * @java Match.instances()
   */
  public instances(): readonly Subgame[] {
    return this._instances;
  }

  /**
   * @java Match.instances()
   */
  public getInstances(): readonly Subgame[] {
    return this._instances;
  }

  /**
   * @java Match.endRules()
   */
  public endRules(): End {
    return this.end;
  }

  /**
   * @java Match.hasSubgames() — always true for Match
   */
  public hasSubgames(): boolean {
    return true;
  }

  /**
   * @java Match.requiresScore() — matches always track scores
   */
  public requiresScore(): boolean {
    return true;
  }

  /**
   * @java Match.automove() — never automove for a Match
   */
  public automove(): boolean {
    return false;
  }
}

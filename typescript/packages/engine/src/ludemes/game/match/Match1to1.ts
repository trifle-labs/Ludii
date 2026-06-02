/**
 * Match1to1.ts
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
import type { Subgame1to1 } from "./Subgame1to1.js";

/**
 * Defines a match made up of a series of subgames.
 *
 * @java game/match/Match.java
 */
export class Match1to1 {
  /** The name of the match. @java Match.name */
  public readonly name: string;

  /** The number of players. @java Match → Game.players().count() */
  public readonly numPlayers: number;

  /**
   * The subgame instances that make up the match.
   * @java Match.instances
   */
  public readonly instances: readonly Subgame1to1[];

  /**
   * The match-level end rules.
   * @java Match.end
   */
  public readonly end: End;

  /**
   * @java game/match/Match.java — constructor(String name, Players players, Games games, End end)
   */
  public constructor(
    name: string,
    numPlayers: number,
    instances: readonly Subgame1to1[],
    end: End,
  ) {
    if (instances.length === 0) {
      throw new Error("A match needs at least one game.");
    }
    this.name = name;
    this.numPlayers = numPlayers;
    this.instances = instances.slice();
    this.end = end;
  }

  /**
   * @java Match.instances()
   */
  public getInstances(): readonly Subgame1to1[] {
    return this.instances;
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

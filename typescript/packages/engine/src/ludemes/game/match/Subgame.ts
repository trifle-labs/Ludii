/**
 * Subgame.ts
 *
 * @java game/match/Subgame.java
 *
 * Defines an instance game of a match.
 *
 * Data/structure class — no eval(ctx), not registered in the 1:1 registry.
 */

import type { IntFunction } from "../../base.js";

/**
 * Defines an instance game of a match.
 * @java game/match/Subgame.java
 */
export class Subgame {
  /** @java Subgame.gameName */
  public readonly gameName: string;

  /** @java Subgame.optionName */
  public readonly optionName: string | null;

  /**
   * The next instance index function.
   * @java Subgame.nextInstance
   */
  public readonly nextInstance: IntFunction | null;

  /**
   * The result (match score) awarded to the winner.
   * @java Subgame.result
   */
  public readonly result: IntFunction | null;

  /**
   * @java game/match/Subgame.java — constructor
   * @param name   The name of the game instance.
   * @param option The option of the game instance.
   * @param next   The index of the next instance.
   * @param result The score result for the match when game instance is over.
   */
  public constructor(
    name: string,
    option: string | null = null,
    next: IntFunction | null = null,
    result: IntFunction | null = null,
  ) {
    this.gameName = name;
    this.optionName = option;
    this.nextInstance = next;
    this.result = result;
  }

  /** @java Subgame.gameName() */
  public getGameName(): string {
    return this.gameName;
  }

  /** @java Subgame.optionName() */
  public getOptionName(): string | null {
    return this.optionName;
  }

  /** @java Subgame.next() */
  public next(): IntFunction | null {
    return this.nextInstance;
  }

  /** @java Subgame.result() */
  public getResult(): IntFunction | null {
    return this.result;
  }

  /** @java Subgame.toString() */
  public toString(): string {
    let s = `[Subgame: ${this.gameName}`;
    if (this.optionName !== null) s += ` (${this.optionName})`;
    s += "]";
    return s;
  }
}

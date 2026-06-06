// @java Mining/src/utils/bgg/Matches.java

/**
 * Record of matches for user scores.
 *
 * @java utils/bgg/Matches.java
 * @author cambolbro
 */

import type { BggGame } from "./BggGame.js";

/** @java Matches */
export class Matches {
  /** @java Matches.game */
  private readonly _game: BggGame;
  /** @java Matches.scores */
  private readonly _scores: number[] = [];
  /** @java Matches.score */
  private _score = 0;
  /** @java Matches.numberMatches */
  private _numberMatches = 0;

  /** @java Matches(BggGame) */
  public constructor(game: BggGame) {
    this._game = game;
  }

  /** @java Matches.game() */
  public game(): BggGame {
    return this._game;
  }

  /** @java Matches.scores() */
  public scores(): number[] {
    return this._scores;
  }

  /** @java Matches.score() */
  public score(): number {
    return this._score;
  }

  /** @java Matches.add(double) */
  public add(value: number): void {
    this._scores.push(value);
    this._score += value;
  }

  /** @java Matches.setScore(double) */
  public setScore(value: number): void {
    this._score = value;
  }

  /** @java Matches.normalise() */
  public normalise(): void {
    if (this._scores.length === 0) {
      this._score = 0;
    } else {
      this._score /= this._scores.length;
    }
  }

  /** @java Matches.getNumberMatches() */
  public getNumberMatches(): number {
    return this._numberMatches;
  }

  /** @java Matches.setNumberMatches(int) */
  public setNumberMatches(numberMatches: number): void {
    this._numberMatches = numberMatches;
  }
}

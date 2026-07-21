// @java Mining/src/utils/bgg/BggGame.java

/**
 * Record of a BGG game entry.
 *
 * @java utils/bgg/BggGame.java
 * @author cambolbro
 */

import type { Rating } from "./Rating.js";

/** @java BggGame */
export class BggGame {
  /** @java BggGame.index */
  private readonly _index: number;
  /** @java BggGame.bggId */
  private readonly _bggId: number;
  /** @java BggGame.name */
  private readonly _name: string;
  /** @java BggGame.date */
  private readonly _date: string;
  /** @java BggGame.details */
  private readonly _details: string[];
  /** @java BggGame.ratings */
  private readonly _ratings: Rating[] = [];

  /** @java BggGame(int, int, String, String, String[]) */
  public constructor(
    index: number,
    bggId: number,
    name: string,
    date: string,
    details: string[]
  ) {
    this._index = index;
    this._bggId = bggId;
    this._name = name;
    this._date = date;
    this._details = details;
  }

  /** @java BggGame.index() */
  public index(): number {
    return this._index;
  }

  /** @java BggGame.bggId() */
  public bggId(): number {
    return this._bggId;
  }

  /** @java BggGame.name() */
  public name(): string {
    return this._name;
  }

  /** @java BggGame.date() */
  public date(): string {
    return this._date;
  }

  /** @java BggGame.details() */
  public details(): string[] {
    return this._details;
  }

  /** @java BggGame.ratings() */
  public ratings(): Rating[] {
    return this._ratings;
  }

  /**
   * @java BggGame.averageRating()
   */
  public averageRating(): number {
    // If no ratings yet, use score of -1
    if (this._ratings.length === 0) return -1;

    let averageScore = 0.0;
    for (const rating of this._ratings) {
      averageScore += rating.score();
    }
    return averageScore / this._ratings.length;
  }

  /** @java BggGame.add(Rating) */
  public add(rating: Rating): void {
    this._ratings.push(rating);
  }
}

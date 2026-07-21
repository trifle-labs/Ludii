// @java Mining/src/utils/bgg/User.java

/**
 * BGG user.
 *
 * @java utils/bgg/User.java
 */

import type { Rating } from "./Rating.js";

/** @java User */
export class User {
  /** @java User.name */
  private readonly _name: string;
  /** @java User.ratings */
  private readonly _ratings: Rating[] = [];
  /** @java User.match */
  private _match = 0;

  /** @java User(String) */
  public constructor(name: string) {
    this._name = name;
  }

  /** @java User.name() */
  public name(): string {
    return this._name;
  }

  /** @java User.ratings() */
  public ratings(): Rating[] {
    return this._ratings;
  }

  /** @java User.add(Rating) */
  public add(rating: Rating): void {
    this._ratings.push(rating);
  }

  /** @java User.match() */
  public match(): number {
    return this._match;
  }

  /** @java User.setMatch(double) */
  public setMatch(value: number): void {
    this._match = value;
  }
}

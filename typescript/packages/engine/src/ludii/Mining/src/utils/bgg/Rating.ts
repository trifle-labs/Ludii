// @java Mining/src/utils/bgg/Rating.java

/**
 * Rating of a game by a BGG user.
 *
 * @java utils/bgg/Rating.java
 * @author cambolbro
 */

import type { BggGame } from "./BggGame.js";
import type { User } from "./User.js";

/** @java Rating */
export class Rating {
  /** @java Rating.game */
  private readonly _game: BggGame;
  /** @java Rating.user */
  private readonly _user: User;
  /** @java Rating.score */
  private readonly _score: number; // byte in Java → number here

  /** @java Rating(BggGame, User, String) */
  public constructor(game: BggGame, user: User, details: string) {
    this._game = game;
    this._user = user;
    this._score = Rating.extractScore(details);
  }

  /** @java Rating.game() */
  public game(): BggGame {
    return this._game;
  }

  /** @java Rating.user() */
  public user(): User {
    return this._user;
  }

  /** @java Rating.score() */
  public score(): number {
    return this._score;
  }

  /**
   * @java Rating.extractScore(String)
   */
  static extractScore(details: string): number {
    const c = details.indexOf("'score':");
    if (c < 0) {
      console.log("** Failed to find score in: " + details);
      return -1;
    }

    let cc = c + 1;
    while (cc < details.length && details.charAt(cc) !== ",") cc++;

    if (cc >= details.length) {
      console.log("** Failed to find closing ',' for score in: " + details);
      return -1;
    }

    const str = details.substring(c + 9, cc).trim();

    let value = -1;
    const parsed = parseFloat(str);
    if (!isNaN(parsed)) {
      value = parsed;
    } else {
      const parsedInt = parseInt(str, 10);
      if (!isNaN(parsedInt)) {
        value = parsedInt;
      }
    }

    return Math.trunc(value + 0.5); // (byte)(value + 0.5) in Java
  }
}

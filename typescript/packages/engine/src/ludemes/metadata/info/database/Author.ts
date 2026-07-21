/**
 * @java metadata/info/database/Author.java Author
 *
 * Specifies the author of the game or ruleset.
 *
 * @author Matthew.Stephenson
 *
 * @example (author "John Doe")
 */

import type { InfoItem } from "../InfoItem.js";

export class Author implements InfoItem {
  /** Game author. */
  private readonly _author: string;

  /**
   * @java metadata/info/database/Author.java — constructor
   * @param author The author of the game.
   */
  public constructor(author: string) {
    this._author = author;
  }

  /**
   * @java metadata/info/database/Author.java — author()
   * @returns Game author.
   */
  public author(): string {
    return this._author;
  }

  /** @java metadata/info/database/Author.java — toString() */
  public toString(): string {
    return `    (author "${this._author}")\n`;
  }
}

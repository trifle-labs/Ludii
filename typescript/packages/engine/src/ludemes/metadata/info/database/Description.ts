/**
 * @java metadata/info/database/Description.java Description
 *
 * Specifies a description of the game.
 *
 * @author Matthew.Stephenson
 *
 * @example (description "A traditional game that comes from Egypt.")
 */

import type { InfoItem } from "../InfoItem.js";

export class Description implements InfoItem {
  /** English description of the game. */
  private readonly _description: string;

  /**
   * @java metadata/info/database/Description.java — constructor
   * @param description An English description of the game.
   */
  public constructor(description: string) {
    this._description = description;
  }

  /**
   * @java metadata/info/database/Description.java — description()
   * @returns English description of the game.
   */
  public description(): string {
    return this._description;
  }

  /** @java metadata/info/database/Description.java — toString() */
  public toString(): string {
    return `    (description "${this._description}")\n`;
  }
}

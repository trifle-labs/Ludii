/**
 * @java metadata/info/database/Aliases.java Aliases
 *
 * Specifies a list of additional aliases for the game's name.
 *
 * @author Matthew.Stephenson
 *
 * @example (aliases {"Caturanga" "Catur"})
 */

import type { InfoItem } from "../InfoItem.js";

export class Aliases implements InfoItem {
  /** Array of aliases. */
  private readonly _aliases: readonly string[];

  /**
   * @java metadata/info/database/Aliases.java — constructor
   * @param aliases Set of additional aliases for the name of this game.
   */
  public constructor(aliases: readonly string[]) {
    this._aliases = aliases;
  }

  /**
   * @java metadata/info/database/Aliases.java — aliases()
   * @returns Additional aliases.
   */
  public aliases(): readonly string[] {
    return this._aliases;
  }

  /** @java metadata/info/database/Aliases.java — toString() */
  public toString(): string {
    return `    (aliases "${this._aliases}")\n`;
  }
}

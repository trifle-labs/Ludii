/**
 * @java metadata/info/database/Rules.java Rules
 *
 * Specifies an English description of the rules of a game.
 *
 * @author Matthew.Stephenson and cambolbro
 *
 * @example (rules "Try to make a line of four.")
 */

import type { InfoItem } from "../InfoItem.js";

export class InfoRules implements InfoItem {
  private readonly _rules: string;

  /**
   * @java metadata/info/database/Rules.java — constructor
   * @param rules An English description of the game's rules.
   */
  public constructor(rules: string) {
    this._rules = rules;
  }

  /**
   * @java metadata/info/database/Rules.java — rules()
   * @returns English description of the rules.
   */
  public rules(): string {
    return this._rules;
  }

  /** @java metadata/info/database/Rules.java — toString() */
  public toString(): string {
    return `    (rules "${this._rules}")\n`;
  }
}

/**
 * @java metadata/info/database/Credit.java Credit
 *
 * Specifies the author of the .lud file and any relevant credit information.
 * This is NOT for the author of the game or ruleset — use Author for that.
 *
 * @author cambolbro
 *
 * @example (credit "A. Fool, April Fool Games, 1/4/2020")
 */

import type { InfoItem } from "../InfoItem.js";

export class Credit implements InfoItem {
  /** .lud author, date, publication details, etc. */
  private readonly _credit: string;

  /**
   * @java metadata/info/database/Credit.java — constructor
   * @param credit The author of the .lud file.
   */
  public constructor(credit: string) {
    this._credit = credit;
  }

  /**
   * @java metadata/info/database/Credit.java — credit()
   * @returns .lud author.
   */
  public credit(): string {
    return this._credit;
  }

  /** @java metadata/info/database/Credit.java — toString() */
  public toString(): string {
    return `    (credit "${this._credit}")\n`;
  }
}

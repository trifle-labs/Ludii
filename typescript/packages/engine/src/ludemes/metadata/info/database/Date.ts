/**
 * @java metadata/info/database/Date.java Date
 *
 * Specifies the (approximate) date that the game was created.
 * Date is specified in the format YYYY-MM-DD.
 *
 * @author Matthew.Stephenson
 *
 * @example (date "2015-10-05")
 */

import type { InfoItem } from "../InfoItem.js";

export class InfoDate implements InfoItem {
  /** The date the game was created. */
  private readonly _date: string;

  /**
   * @java metadata/info/database/Date.java — constructor
   * @param date The date the game was created (YYYY-MM-DD).
   */
  public constructor(date: string) {
    this._date = date;
  }

  /**
   * @java metadata/info/database/Date.java — date()
   * @returns The date the game was created.
   */
  public date(): string {
    return this._date;
  }

  /** @java metadata/info/database/Date.java — toString() */
  public toString(): string {
    return `    (date "${this._date}")\n`;
  }
}

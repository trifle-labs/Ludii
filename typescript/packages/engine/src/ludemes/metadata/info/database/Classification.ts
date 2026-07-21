/**
 * @java metadata/info/database/Classification.java Classification
 *
 * Specifies the location of this game within the Ludii classification scheme.
 * The Ludii classification is a combination of the schemes used in
 * H. J. R. Murray's "A History of Board Games other than Chess" and
 * David Parlett's "The Oxford History of Board Games", with additional
 * categories to reflect the wider range of games supported by Ludii.
 *
 * @author cambolbro
 *
 * @example (classification "games/board/war/chess")
 */

import type { InfoItem } from "../InfoItem.js";

export class Classification implements InfoItem {
  private readonly _classification: string;

  /**
   * @java metadata/info/database/Classification.java — constructor
   * @param classification The game's location within the Ludii classification scheme.
   */
  public constructor(classification: string) {
    this._classification = classification;
  }

  /**
   * @java metadata/info/database/Classification.java — classification()
   * @returns The classification.
   */
  public classification(): string {
    return this._classification;
  }

  /** @java metadata/info/database/Classification.java — toString() */
  public toString(): string {
    return `    (classification "${this._classification}")\n`;
  }
}

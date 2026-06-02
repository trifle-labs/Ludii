/**
 * @java metadata/info/database/Source.java Source
 *
 * Specifies the reference for the game, or its currently chosen ruleset.
 *
 * @author Matthew.Stephenson
 *
 * @example (source "Murray 1969")
 */

import type { InfoItem } from "../InfoItem.js";

export class Source implements InfoItem {
  /** Rules source. */
  private readonly _source: string;

  /**
   * @java metadata/info/database/Source.java — constructor
   * @param source The source of the game's rules.
   */
  public constructor(source: string) {
    this._source = source;
  }

  /**
   * @java metadata/info/database/Source.java — source()
   * @returns The source of the game's rules.
   */
  public source(): string {
    return this._source;
  }

  /** @java metadata/info/database/Source.java — toString() */
  public toString(): string {
    return `    (source "${this._source}")\n`;
  }
}

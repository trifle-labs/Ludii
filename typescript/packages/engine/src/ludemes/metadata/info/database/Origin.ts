/**
 * @java metadata/info/database/Origin.java Origin
 *
 * Specifies the location of the earliest known origin for this game.
 *
 * @author cambolbro
 *
 * @example (origin "1953")
 */

import type { InfoItem } from "../InfoItem.js";

export class Origin implements InfoItem {
  private readonly _origin: string;

  /**
   * @java metadata/info/database/Origin.java — constructor
   * @param origin Earliest known origin for this game.
   */
  public constructor(origin: string) {
    this._origin = origin;
  }

  /**
   * @java metadata/info/database/Origin.java — origin()
   * @returns The origin as a string.
   */
  public origin(): string {
    return this._origin;
  }

  /** @java metadata/info/database/Origin.java — toString() */
  public toString(): string {
    return `    (origin "${this._origin}")\n`;
  }
}

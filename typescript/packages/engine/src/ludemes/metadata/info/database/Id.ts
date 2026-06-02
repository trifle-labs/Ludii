/**
 * @java metadata/info/database/Id.java Id
 *
 * Specifies the database Id for the currently chosen ruleset.
 *
 * @author Matthew.Stephenson
 *
 * @example (id "35")
 */

import type { InfoItem } from "../InfoItem.js";

export class InfoId implements InfoItem {
  /** Ruleset Database Id. */
  private readonly _id: string;

  /**
   * @java metadata/info/database/Id.java — constructor
   * @param id The ruleset database table Id.
   */
  public constructor(id: string) {
    this._id = id;
  }

  /**
   * @java metadata/info/database/Id.java — id()
   * @returns The ruleset database table Id.
   */
  public id(): string {
    return this._id;
  }

  /** @java metadata/info/database/Id.java — toString() */
  public toString(): string {
    return `    (id "${this._id}")\n`;
  }
}

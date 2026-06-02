/**
 * @java metadata/info/database/Publisher.java Publisher
 *
 * Specifies the publisher of the game.
 *
 * @author Matthew.Stephenson
 *
 * @example (publisher "Games Inc.")
 */

import type { InfoItem } from "../InfoItem.js";

export class Publisher implements InfoItem {
  /** Game Publisher. */
  private readonly _publisher: string;

  /**
   * @java metadata/info/database/Publisher.java — constructor
   * @param publisher The publisher of the game.
   */
  public constructor(publisher: string) {
    this._publisher = publisher;
  }

  /**
   * @java metadata/info/database/Publisher.java — publisher()
   * @returns Game publisher.
   */
  public publisher(): string {
    return this._publisher;
  }

  /** @java metadata/info/database/Publisher.java — toString() */
  public toString(): string {
    return `    (publisher "${this._publisher}")\n`;
  }
}

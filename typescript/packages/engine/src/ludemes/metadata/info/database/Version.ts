/**
 * @java metadata/info/database/Version.java Version
 *
 * Specifies the latest Ludii version that this .lud is known to work for.
 * The version format is (Major version).(Minor version).(Build number).
 * For example, the first major version for public release is "1.0.0".
 *
 * @author cambolbro
 *
 * @example (version "1.0.0")
 */

import type { InfoItem } from "../InfoItem.js";

export class Version implements InfoItem {
  private readonly _version: string;

  /**
   * @java metadata/info/database/Version.java — constructor
   * @param version Ludii version in string form.
   */
  public constructor(version: string) {
    this._version = version;
  }

  /**
   * @java metadata/info/database/Version.java — version()
   * @returns The version.
   */
  public version(): string {
    return this._version;
  }

  /** @java metadata/info/database/Version.java — toString() */
  public toString(): string {
    return `    (version "${this._version}")\n`;
  }
}

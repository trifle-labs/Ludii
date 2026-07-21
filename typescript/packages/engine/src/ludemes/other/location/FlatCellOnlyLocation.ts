// @java Core/src/other/location/FlatCellOnlyLocation.java FlatCellOnlyLocation
/**
 * Location for Cell-only, non-stacking games (level always 0).
 *
 * Faithful 1:1 transliteration of other.location.FlatCellOnlyLocation.
 *
 * @author Dennis Soemers  (Java original)
 */

import { Location } from "./Location.js";
import type { SiteType } from "./Location.js";

/**
 * Flat Cell-only location (no level, no SiteType stored).
 * @java other.location.FlatCellOnlyLocation
 */
export class FlatCellOnlyLocation extends Location {
  private readonly _site: number;

  /**
   * @java FlatCellOnlyLocation(int site)
   */
  constructor(site: number) {
    super();
    this._site = site;
  }

  override copy(): FlatCellOnlyLocation {
    return new FlatCellOnlyLocation(this._site);
  }

  override site():     number   { return this._site; }
  override level():    number   { return 0; }
  override siteType(): SiteType { return "Cell"; }

  override decrementLevel(): void {
    throw new Error("UnsupportedOperationException: FlatCellOnlyLocation has no level");
  }

  override incrementLevel(): void {
    throw new Error("UnsupportedOperationException: FlatCellOnlyLocation has no level");
  }
}

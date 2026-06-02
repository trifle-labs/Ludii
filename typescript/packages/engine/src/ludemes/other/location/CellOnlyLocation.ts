// @java Core/src/other/location/CellOnlyLocation.java CellOnlyLocation
/**
 * Location for games that use only Cells.
 *
 * Faithful 1:1 transliteration of other.location.CellOnlyLocation.
 *
 * @author Dennis Soemers  (Java original)
 */

import { Location } from "./Location.js";
import type { SiteType } from "./Location.js";

/**
 * Location for games that use only Cells (optimised — stores no SiteType).
 * @java other.location.CellOnlyLocation
 */
export class CellOnlyLocation extends Location {
  private readonly _site:  number;
  private          _level: number;

  /**
   * Constructor for stacking game.
   * @java CellOnlyLocation(int site, int level)
   */
  constructor(site: number, level: number);

  /**
   * Constructor for non-stacking game (level defaults to 0).
   * @java CellOnlyLocation(int site)
   */
  constructor(site: number);

  constructor(site: number, level?: number) {
    super();
    this._site  = site;
    this._level = level ?? 0;
  }

  override copy(): CellOnlyLocation {
    return new CellOnlyLocation(this._site, this._level);
  }

  override site():     number   { return this._site; }
  override level():    number   { return this._level; }
  override siteType(): SiteType { return "Cell"; }

  override decrementLevel(): void { this._level -= 1; }
  override incrementLevel(): void { this._level += 1; }
}

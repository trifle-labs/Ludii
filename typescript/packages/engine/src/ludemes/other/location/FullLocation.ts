// @java Core/src/other/location/FullLocation.java FullLocation
/**
 * Full location: site + level + SiteType, no optimisations.
 *
 * Faithful 1:1 transliteration of other.location.FullLocation.
 *
 * @author Dennis Soemers  (Java original)
 */

import { Location } from "./Location.js";
import type { SiteType } from "./Location.js";

/**
 * "Full" version of Location with all data (no optimisations).
 * @java other.location.FullLocation
 */
export class FullLocation extends Location {
  private readonly _site:     number;
  private          _level:    number;
  private readonly _siteType: SiteType;

  // -------- constructors ---------------------------------------------------

  /**
   * Constructor for stacking game with site type.
   * @java FullLocation(int site, int level, SiteType siteType)
   */
  constructor(site: number, level: number, siteType: SiteType);

  /**
   * Constructor for stacking game (Cell assumed).
   * @java FullLocation(int site, int level)
   */
  constructor(site: number, level: number);

  /**
   * Constructor for non-stacking game (level=0, Cell assumed).
   * @java FullLocation(int site)
   */
  constructor(site: number);

  /**
   * Constructor for non-stacking game with site type.
   * @java FullLocation(int site, SiteType siteType)
   */
  constructor(site: number, siteType: SiteType);

  constructor(
    site: number,
    levelOrSiteType?: number | SiteType,
    siteType?: SiteType,
  ) {
    super();
    this._site = site;

    if (siteType !== undefined) {
      // (site, level, siteType)
      this._level    = levelOrSiteType as number;
      this._siteType = siteType;
    } else if (typeof levelOrSiteType === "number") {
      // (site, level)
      this._level    = levelOrSiteType;
      this._siteType = "Cell";
    } else if (typeof levelOrSiteType === "string") {
      // (site, siteType)
      this._level    = 0;
      this._siteType = levelOrSiteType;
    } else {
      // (site)
      this._level    = 0;
      this._siteType = "Cell";
    }
  }

  // -------- copy -----------------------------------------------------------

  /** @java FullLocation#copy() */
  override copy(): FullLocation {
    return new FullLocation(this._site, this._level, this._siteType);
  }

  // -------- accessors ------------------------------------------------------

  override site():     number   { return this._site; }
  override level():    number   { return this._level; }
  override siteType(): SiteType { return this._siteType; }

  override decrementLevel(): void { this._level -= 1; }
  override incrementLevel(): void { this._level += 1; }
}

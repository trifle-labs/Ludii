// @java Core/src/other/location/FlatVertexOnlyLocation.java FlatVertexOnlyLocation
/**
 * Location for Vertex-only, non-stacking games (level always 0).
 *
 * Faithful 1:1 transliteration of other.location.FlatVertexOnlyLocation.
 *
 * @author Dennis Soemers  (Java original)
 */

import { Location } from "./Location.js";
import type { SiteType } from "./Location.js";

/**
 * Flat Vertex-only location (no level, SiteType is always Vertex).
 * @java other.location.FlatVertexOnlyLocation
 */
export class FlatVertexOnlyLocation extends Location {
  private readonly _site: number;

  /**
   * @java FlatVertexOnlyLocation(int site)
   */
  constructor(site: number) {
    super();
    this._site = site;
  }

  override copy(): FlatVertexOnlyLocation {
    return new FlatVertexOnlyLocation(this._site);
  }

  override site():     number   { return this._site; }
  override level():    number   { return 0; }
  override siteType(): SiteType { return "Vertex"; }

  override decrementLevel(): void {
    throw new Error("UnsupportedOperationException: FlatVertexOnlyLocation has no level");
  }

  override incrementLevel(): void {
    throw new Error("UnsupportedOperationException: FlatVertexOnlyLocation has no level");
  }
}

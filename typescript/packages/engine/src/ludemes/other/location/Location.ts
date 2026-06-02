// @java Core/src/other/location/Location.java Location
/**
 * Abstract location: a site + level + SiteType.
 *
 * Faithful 1:1 transliteration of other.location.Location.
 *
 * @author Eric.Piette and Matthew.Stephenson and Dennis Soemers  (Java original)
 */

export type SiteType = "Cell" | "Edge" | "Vertex";

/**
 * Abstract base for all location types.
 * A location is the site of a component and the level on it (for stacking games).
 * @java other.location.Location
 */
export abstract class Location {
  /** @java Location#copy() */
  abstract copy(): Location;

  /** @java Location#site() */
  abstract site(): number;

  /** @java Location#level() */
  abstract level(): number;

  /** @java Location#siteType() */
  abstract siteType(): SiteType;

  /** @java Location#decrementLevel() */
  abstract decrementLevel(): void;

  /** @java Location#incrementLevel() */
  abstract incrementLevel(): void;

  // -------- hashCode / equals ----------------------------------------------

  /** @java Location#hashCode() */
  hashCode(): number {
    const prime = 31;
    let result  = 1;
    result = prime * result + this.site();
    result = prime * result + this.level();
    result = prime * result + (this.siteType() === "Cell" ? 0 : this.siteType() === "Edge" ? 1 : 2);
    return result;
  }

  /** @java Location#equals(Object) */
  equals(obj: unknown): boolean {
    if (this === obj) return true;
    if (!(obj instanceof Location)) return false;
    return (
      this.site()     === obj.site()     &&
      this.level()    === obj.level()    &&
      this.siteType() === obj.siteType()
    );
  }

  /** @java Location#toString() */
  toString(): string {
    return `Location(site:${this.site()} level: ${this.level()} siteType: ${this.siteType()})`;
  }
}

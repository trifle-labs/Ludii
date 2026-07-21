/**
 * Sets the colour of a specified region.
 *
 * @java metadata/graphics/region/colour/RegionColour.java
 */

import type { RoleTypeFull } from "../../../../game/types/play/RoleType.js";
import type { Colour } from "../../util/colour/Colour.js";

/**
 * SiteType alias (Cell | Vertex | Edge).
 * Mirrors game/types/board/SiteType — inline here to avoid cross-package deps.
 *
 * @java game/types/board/SiteType.java
 */
export type SiteType = "Vertex" | "Edge" | "Cell";

/**
 * Opaque RegionFunction reference — will reference game/functions/region/RegionFunction.
 *
 * @java game/functions/region/RegionFunction.java
 */
export type RegionFunctionRef = unknown;

/**
 * @java metadata/graphics/region/colour/RegionColour.java — class RegionColour implements GraphicsItem
 */
export class RegionColour {
  /** Region to colour. */
  readonly region: string | null;

  /** Sites to colour. */
  readonly sites: number[] | null;

  /** Region function to colour. */
  readonly regionFunction: RegionFunctionRef | null;

  /** SiteType to be coloured. */
  readonly graphElementType: SiteType | null;

  /** Colour to apply. */
  readonly colour: Colour | null;

  /** RoleType condition. */
  readonly roleType: RoleTypeFull | null;

  /** The SiteType of the region. */
  readonly regionSiteType: SiteType | null;

  /** The scale for the region graphics (only applies to Edge siteType). */
  readonly scale: number;

  constructor(
    region: string | null,
    roleType: RoleTypeFull | null,
    graphElementType: SiteType | null,
    sites: number[] | null,
    regionFunction: RegionFunctionRef | null,
    regionSiteType: SiteType | null,
    colour: Colour | null,
    scale: number | null,
  ) {
    this.region = region;
    this.roleType = roleType;
    this.graphElementType = graphElementType;
    this.sites = sites;
    this.regionFunction = regionFunction;
    this.regionSiteType = regionSiteType;
    this.colour = colour;
    this.scale = scale === null ? 1.0 : scale;
  }

  /** @return Region to Colour. */
  getRegion(): string | null {
    return this.region;
  }

  /** @return Sites to Colour. */
  getSites(): number[] | null {
    return this.sites;
  }

  /** @return Colour to apply. */
  getColour(): Colour | null {
    return this.colour;
  }

  /** @return Region function to Colour. */
  getRegionFunction(): RegionFunctionRef | null {
    return this.regionFunction;
  }

  /** @return RoleType condition to check. */
  getRoleType(): RoleTypeFull | null {
    return this.roleType;
  }

  /** @return The scale for the region graphics (only applies to Edge siteType). */
  getScale(): number {
    return this.scale;
  }

  needRedraw(): boolean {
    if (this.regionFunction !== null) {
      // Conservative: cannot determine isStatic without full RegionFunction
      return false;
    }
    return false;
  }
}

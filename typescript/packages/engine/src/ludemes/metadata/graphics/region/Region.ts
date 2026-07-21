/**
 * Sets a graphic element to a region.
 *
 * @java metadata/graphics/region/Region.java
 */

import type { RoleTypeFull } from "../../../game/types/play/RoleType.js";
import { RegionColour } from "./colour/RegionColour.js";
import type { SiteType, RegionFunctionRef } from "./colour/RegionColour.js";
import type { Colour } from "../util/colour/Colour.js";

/** @java metadata/graphics/region/RegionColourType.java */
export type RegionColourType = "Colour";

/**
 * Union of all concrete region-graphics-item types.
 *
 * @java metadata/graphics/region/Region.java — class Region implements GraphicsItem
 */
export type RegionGraphicsItem = RegionColour;

/**
 * Factory: constructs a RegionColour.
 *
 * @java metadata/graphics/region/Region.java — construct(RegionColourType, ...)
 */
export function constructRegionColour(
  regionType: RegionColourType,
  region: string | null,
  roleType: RoleTypeFull | null,
  graphElementType: SiteType | null,
  sites: number[] | null,
  regionFunction: RegionFunctionRef | null,
  regionSiteType: SiteType | null,
  colour: Colour | null,
  scale: number | null,
): RegionColour {
  switch (regionType) {
    case "Colour":
      return new RegionColour(
        region,
        roleType,
        graphElementType,
        sites,
        regionFunction,
        regionSiteType,
        colour,
        scale,
      );
  }
}

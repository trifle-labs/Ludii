/**
 * Defines the types of Region metadata depending of a colour.
 *
 * @java metadata/graphics/region/RegionColourType.java
 */
export const REGION_COLOUR_TYPES = [
  /** To set the colour of a region. */
  "Colour",
] as const;

/** @java metadata/graphics/region/RegionColourType.java — enum RegionColourType */
export type RegionColourType = (typeof REGION_COLOUR_TYPES)[number];

/** True iff the given string is a valid RegionColourType value. */
export function isRegionColourType(value: string): value is RegionColourType {
  return (REGION_COLOUR_TYPES as readonly string[]).includes(value);
}

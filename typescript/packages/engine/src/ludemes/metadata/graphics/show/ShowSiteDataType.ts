/**
 * ShowSiteDataType.ts
 *
 * @java metadata/graphics/show/ShowSiteDataType.java
 *
 * Defines the types of Show metadata related to a data of the sites.
 */

/** @java metadata.graphics.show.ShowSiteDataType */
export const SHOW_SITE_DATA_TYPES = [
  /** Whether the sites of the board should be represented as holes. */
  "AsHoles",

  /** Whether the sites of the board should have their index displayed. */
  "SiteIndex",
] as const;

/** @java metadata.graphics.show.ShowSiteDataType */
export type ShowSiteDataType = (typeof SHOW_SITE_DATA_TYPES)[number];

/** True iff the given string is a valid ShowSiteDataType value. */
export function isShowSiteDataType(value: string): value is ShowSiteDataType {
  return (SHOW_SITE_DATA_TYPES as readonly string[]).includes(value);
}

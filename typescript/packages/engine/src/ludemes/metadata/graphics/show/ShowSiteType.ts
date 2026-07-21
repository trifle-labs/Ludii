/**
 * ShowSiteType.ts
 *
 * @java metadata/graphics/show/ShowSiteType.java
 *
 * Defines the types of Show metadata related to a site.
 */

/** @java metadata.graphics.show.ShowSiteType */
export const SHOW_SITE_TYPES = [
  /** Apply it on the sites. */
  "Sites",

  /** Apply it on the cells. */
  "Cell",
] as const;

/** @java metadata.graphics.show.ShowSiteType */
export type ShowSiteType = (typeof SHOW_SITE_TYPES)[number];

/** True iff the given string is a valid ShowSiteType value. */
export function isShowSiteType(value: string): value is ShowSiteType {
  return (SHOW_SITE_TYPES as readonly string[]).includes(value);
}

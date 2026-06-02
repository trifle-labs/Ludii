/**
 * ShowCheckType.ts
 *
 * @java metadata/graphics/show/ShowCheckType.java
 *
 * Defines the types of Show metadata for a check.
 */

/** @java metadata.graphics.show.ShowCheckType */
export const SHOW_CHECK_TYPES = [
  /** Whether a "Check" should be displayed when a piece is in threatened. */
  "Check",
] as const;

/** @java metadata.graphics.show.ShowCheckType */
export type ShowCheckType = (typeof SHOW_CHECK_TYPES)[number];

/** True iff the given string is a valid ShowCheckType value. */
export function isShowCheckType(value: string): value is ShowCheckType {
  return (SHOW_CHECK_TYPES as readonly string[]).includes(value);
}

/**
 * ShowLineType.ts
 *
 * @java metadata/graphics/show/ShowLineType.java
 *
 * Defines the types of Draw metadata related to line.
 */

/** @java metadata.graphics.show.ShowLineType */
export const SHOW_LINE_TYPES = [
  /** Draws a specified line on the board. */
  "Line",
] as const;

/** @java metadata.graphics.show.ShowLineType */
export type ShowLineType = (typeof SHOW_LINE_TYPES)[number];

/** True iff the given string is a valid ShowLineType value. */
export function isShowLineType(value: string): value is ShowLineType {
  return (SHOW_LINE_TYPES as readonly string[]).includes(value);
}

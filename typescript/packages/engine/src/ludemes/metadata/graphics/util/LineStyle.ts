/**
 * LineStyle.ts
 *
 * @java metadata/graphics/util/LineStyle.java
 *
 * Defines line styles for drawing board elements, e.g. edges for graph games.
 */

/** @java metadata.graphics.util.LineStyle */
export const LINE_STYLES = [
  /** Thin line. */
  "Thin",

  /** Thick line. */
  "Thick",

  /** Thin dotted line. */
  "ThinDotted",

  /** Thick dotted line. */
  "ThickDotted",

  /** Thin dashed line. */
  "ThinDashed",

  /** Thick dashed line. */
  "ThickDashed",

  /** Line not drawn. */
  "Hidden",
] as const;

/** @java metadata.graphics.util.LineStyle */
export type LineStyle = (typeof LINE_STYLES)[number];

/** True iff the given string is a valid LineStyle value. */
export function isLineStyle(value: string): value is LineStyle {
  return (LINE_STYLES as readonly string[]).includes(value);
}

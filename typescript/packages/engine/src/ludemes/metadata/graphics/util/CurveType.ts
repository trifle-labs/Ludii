/**
 * CurveType.ts
 *
 * @java metadata/graphics/util/CurveType.java
 *
 * Supported style types for drawing curves.
 */

/** @java metadata.graphics.util.CurveType */
export const CURVE_TYPES = [
  /** Spline curve based on relative distances. */
  "Spline",

  /** Bezier curve based on absolute distances. */
  "Bezier",
] as const;

/** @java metadata.graphics.util.CurveType */
export type CurveType = (typeof CURVE_TYPES)[number];

/** True iff the given string is a valid CurveType value. */
export function isCurveType(value: string): value is CurveType {
  return (CURVE_TYPES as readonly string[]).includes(value);
}

/**
 * Returns the CurveType for a name, defaulting to "Spline".
 * @java CurveType.fromName(String)
 */
export function curveTypeFromName(name: string): CurveType {
  return isCurveType(name) ? name : "Spline";
}

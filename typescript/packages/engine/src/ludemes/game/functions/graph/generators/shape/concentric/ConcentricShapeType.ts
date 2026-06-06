// @java Core/src/game/functions/graph/generators/shape/concentric/ConcentricShapeType.java

/**
 * Defines star shape types for known board types.
 *
 * @java game/functions/graph/generators/shape/concentric/ConcentricShapeType.java
 * @author cambolbro
 */
export const CONCENTRIC_SHAPE_TYPES = [
  /** Concentric squares rings, e.g. Morris boards. */
  "Square",
  /** Concentric triangles. */
  "Triangle",
  /** Concentric hexagons. */
  "Hexagon",
  /** Concentric circles, like a target. */
  "Target",
] as const;

/** @java game/functions/graph/generators/shape/concentric/ConcentricShapeType.java — enum ConcentricShapeType */
export type ConcentricShapeType = (typeof CONCENTRIC_SHAPE_TYPES)[number];

/** True iff the given string is a valid ConcentricShapeType value. */
export function isConcentricShapeType(value: string): value is ConcentricShapeType {
  return (CONCENTRIC_SHAPE_TYPES as readonly string[]).includes(value);
}

// @java Core/src/game/functions/graph/generators/shape/ShapeStarType.java

/**
 * Defines star shape types for known board types.
 *
 * @java game/functions/graph/generators/shape/ShapeStarType.java
 * @author cambolbro
 */
export const SHAPE_STAR_TYPES = [
  /** Multi-pointed star shape. */
  "Star",
] as const;

/** @java game/functions/graph/generators/shape/ShapeStarType.java — enum ShapeStarType */
export type ShapeStarType = (typeof SHAPE_STAR_TYPES)[number];

/** True iff the given string is a valid ShapeStarType value. */
export function isShapeStarType(value: string): value is ShapeStarType {
  return (SHAPE_STAR_TYPES as readonly string[]).includes(value);
}

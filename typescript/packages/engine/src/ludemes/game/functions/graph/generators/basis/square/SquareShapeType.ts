// @java Core/src/game/functions/graph/generators/basis/square/SquareShapeType.java

/**
 * Defines known shapes for the square tiling.
 *
 * @java game/functions/graph/generators/basis/square/SquareShapeType.java
 * @author cambolbro
 */
export const SQUARE_SHAPE_TYPES = [
  /** No shape; custom graph. */
  "NoShape",
  /** Square board shape. */
  "Square",
  /** Rectangular board shape. */
  "Rectangle",
  /** Diamond board shape. */
  "Diamond",
  /** Alternating sides are staggered. */
  "Limping",
] as const;

/** @java game/functions/graph/generators/basis/square/SquareShapeType.java — enum SquareShapeType */
export type SquareShapeType = (typeof SQUARE_SHAPE_TYPES)[number];

/** True iff the given string is a valid SquareShapeType value. */
export function isSquareShapeType(value: string): value is SquareShapeType {
  return (SQUARE_SHAPE_TYPES as readonly string[]).includes(value);
}

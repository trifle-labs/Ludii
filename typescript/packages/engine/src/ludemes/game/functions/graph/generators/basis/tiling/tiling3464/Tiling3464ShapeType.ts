// @java Core/src/game/functions/graph/generators/basis/tiling/tiling3464/Tiling3464ShapeType.java

/**
 * Defines known shapes for the rhombitrihexahedral (semi-regular 3.4.6.4) tiling.
 *
 * @java game/functions/graph/generators/basis/tiling/tiling3464/Tiling3464ShapeType.java
 * @author cambolbro
 */
export const TILING3464_SHAPE_TYPES = [
  /** Custom board shape. */
  "Custom",
  /** Square board shape. */
  "Square",
  /** Rectangular board shape. */
  "Rectangle",
  /** Diamond board shape. */
  "Diamond",
  /** Diamond board shape extended vertically. */
  "Prism",
  /** Triangular board shape. */
  "Triangle",
  /** Hexagonal board shape. */
  "Hexagon",
  /** Multi-pointed star shape. */
  "Star",
  /** Alternating sides are staggered. */
  "Limping",
] as const;

/** @java game/functions/graph/generators/basis/tiling/tiling3464/Tiling3464ShapeType.java — enum Tiling3464ShapeType */
export type Tiling3464ShapeType = (typeof TILING3464_SHAPE_TYPES)[number];

/** True iff the given string is a valid Tiling3464ShapeType value. */
export function isTiling3464ShapeType(value: string): value is Tiling3464ShapeType {
  return (TILING3464_SHAPE_TYPES as readonly string[]).includes(value);
}

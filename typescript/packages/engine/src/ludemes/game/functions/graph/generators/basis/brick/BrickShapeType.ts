// @java Core/src/game/functions/graph/generators/basis/brick/BrickShapeType.java

/**
 * Defines known shapes for the brick tiling.
 *
 * @java game/functions/graph/generators/basis/brick/BrickShapeType.java
 * @author cambolbro
 */
export const BRICK_SHAPE_TYPES = [
  /** Square board shape. */
  "Square",
  /** Rectangular board shape. */
  "Rectangle",
  /** Diamond board shape. */
  "Diamond",
  /** Prism board shape. */
  "Prism",
  /** Spiral board shape. */
  "Spiral",
  /** Alternating sides are staggered. */
  "Limping",
] as const;

/** @java game/functions/graph/generators/basis/brick/BrickShapeType.java — enum BrickShapeType */
export type BrickShapeType = (typeof BRICK_SHAPE_TYPES)[number];

/** True iff the given string is a valid BrickShapeType value. */
export function isBrickShapeType(value: string): value is BrickShapeType {
  return (BRICK_SHAPE_TYPES as readonly string[]).includes(value);
}

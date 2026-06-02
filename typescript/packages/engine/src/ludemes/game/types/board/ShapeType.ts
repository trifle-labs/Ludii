/**
 * Defines shape types for known board shapes.
 *
 * @java game/types/board/ShapeType.java
 */
export const SHAPE_TYPES = [
  /** No defined board shape. */
  "NoShape",
  /** Custom board shape defined by the user. */
  "Custom",
  /** Square board shape. */
  "Square",
  /** Rectangular board shape. */
  "Rectangle",
  /** Triangular board shape. */
  "Triangle",
  /** Hexagonal board shape. */
  "Hexagon",
  /** Cross board shape. */
  "Cross",
  /** Diamond board shape. */
  "Diamond",
  /** Diamond board shape extended vertically. */
  "Prism",
  /** General quadrilateral board shape. */
  "Quadrilateral",
  /** Rhombus board shape. */
  "Rhombus",
  /** Wheel board shape. */
  "Wheel",
  /** Circular board shape. */
  "Circle",
  /** Spiral board shape. */
  "Spiral",
  /** Wedge shape of height N with 1 vertex at the top and 3 vertices on the bottom, for Alquerque boards. */
  "Wedge",
  /** Multi-pointed star shape. */
  "Star",
  /** Alternating sides are staggered. */
  "Limping",
  /** Regular polygon with sides of the same length. */
  "Regular",
  /** General polygon. */
  "Polygon",
] as const;

/** @java game/types/board/ShapeType.java — enum ShapeType */
export type ShapeType = (typeof SHAPE_TYPES)[number];

/** True iff the given string is a valid ShapeType value. */
export function isShapeType(value: string): value is ShapeType {
  return (SHAPE_TYPES as readonly string[]).includes(value);
}

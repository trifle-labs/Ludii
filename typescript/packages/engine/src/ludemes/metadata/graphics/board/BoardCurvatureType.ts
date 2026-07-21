// @java Core/src/metadata/graphics/board/BoardCurvatureType.java BoardCurvatureType
/**
 * Java parity:
 * - Core/src/metadata/graphics/board/BoardCurvatureType.java — faithful enum port.
 *   Defines the types of Board metadata related to the curvature style.
 */

export const BOARD_CURVATURE_TYPES = [
  /** To set the curve offset when drawing curves. */
  "Curvature",
] as const;

export type BoardCurvatureType = (typeof BOARD_CURVATURE_TYPES)[number];

export function isBoardCurvatureType(value: string): value is BoardCurvatureType {
  return (BOARD_CURVATURE_TYPES as readonly string[]).includes(value);
}

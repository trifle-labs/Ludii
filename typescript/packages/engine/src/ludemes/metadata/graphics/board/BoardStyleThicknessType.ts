// @java Core/src/metadata/graphics/board/BoardStyleThicknessType.java BoardStyleThicknessType
/**
 * Java parity:
 * - Core/src/metadata/graphics/board/BoardStyleThicknessType.java — faithful enum port.
 *   Defines the types of Board metadata related to the thickness style.
 */

export const BOARD_STYLE_THICKNESS_TYPES = [
  /** To set the preferred scale for the thickness of a specific aspect of the board. */
  "StyleThickness",
] as const;

export type BoardStyleThicknessType = (typeof BOARD_STYLE_THICKNESS_TYPES)[number];

export function isBoardStyleThicknessType(value: string): value is BoardStyleThicknessType {
  return (BOARD_STYLE_THICKNESS_TYPES as readonly string[]).includes(value);
}

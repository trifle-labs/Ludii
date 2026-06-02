// @java Core/src/metadata/graphics/board/BoardStyleType.java BoardStyleType
/**
 * Java parity:
 * - Core/src/metadata/graphics/board/BoardStyleType.java — faithful enum port.
 *   Defines the types of Board metadata related to the style.
 */

export const BOARD_STYLE_TYPES = [
  /** To set the style of the board. */
  "Style",
] as const;

export type BoardStyleType = (typeof BOARD_STYLE_TYPES)[number];

export function isBoardStyleType(value: string): value is BoardStyleType {
  return (BOARD_STYLE_TYPES as readonly string[]).includes(value);
}

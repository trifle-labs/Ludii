// @java Core/src/metadata/graphics/board/BoardColourType.java BoardColourType
/**
 * Java parity:
 * - Core/src/metadata/graphics/board/BoardColourType.java — faithful enum port.
 *   Defines the types of Board metadata related to the colour.
 */

export const BOARD_COLOUR_TYPES = [
  /** To set the colour of a specific aspect of the board. */
  "Colour",
] as const;

export type BoardColourType = (typeof BOARD_COLOUR_TYPES)[number];

export function isBoardColourType(value: string): value is BoardColourType {
  return (BOARD_COLOUR_TYPES as readonly string[]).includes(value);
}

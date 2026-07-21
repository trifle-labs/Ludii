// @java Core/src/metadata/graphics/board/BoardBooleanType.java BoardBooleanType
/**
 * Java parity:
 * - Core/src/metadata/graphics/board/BoardBooleanType.java — faithful enum port.
 *   Defines the types of Board metadata depending only on a boolean.
 */

export const BOARD_BOOLEAN_TYPES = [
  /** To indicate whether the board should be drawn in a checkered pattern. */
  "Checkered",
] as const;

export type BoardBooleanType = (typeof BOARD_BOOLEAN_TYPES)[number];

export function isBoardBooleanType(value: string): value is BoardBooleanType {
  return (BOARD_BOOLEAN_TYPES as readonly string[]).includes(value);
}

// @java Core/src/metadata/graphics/board/BoardPlacementType.java BoardPlacementType
/**
 * Java parity:
 * - Core/src/metadata/graphics/board/BoardPlacementType.java — faithful enum port.
 *   Defines the types of Board metadata related to the placement.
 */

export const BOARD_PLACEMENT_TYPES = [
  /** To set the placement of the board. */
  "Placement",
] as const;

export type BoardPlacementType = (typeof BOARD_PLACEMENT_TYPES)[number];

export function isBoardPlacementType(value: string): value is BoardPlacementType {
  return (BOARD_PLACEMENT_TYPES as readonly string[]).includes(value);
}

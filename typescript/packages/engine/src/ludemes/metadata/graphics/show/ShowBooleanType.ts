/**
 * ShowBooleanType.ts
 *
 * @java metadata/graphics/show/ShowBooleanType.java
 *
 * Defines the types of Show metadata depending only on a boolean.
 */

/** @java metadata.graphics.show.ShowBooleanType */
export const SHOW_BOOLEAN_TYPES = [
  /** Whether the pits on the board should be marked with their owner. */
  "Pits",

  /** Whether the player's holes on the board should be marked with their owner. */
  "PlayerHoles",

  /** Whether the holes with a local state of zero should be marked. */
  "LocalStateHoles",

  /** Whether the owner of each region should be shown. */
  "RegionOwner",

  /** Whether the cost of the graph element has to be shown. */
  "Cost",

  /** Whether the hints of the puzzle has to be shown. */
  "Hints",

  /** Whether the edge directions should be shown. */
  "EdgeDirections",

  /** Whether the possible moves are always shown. */
  "PossibleMoves",

  /** Whether curved edges should be shown. */
  "CurvedEdges",

  /** Whether straight edges should be shown. */
  "StraightEdges",
] as const;

/** @java metadata.graphics.show.ShowBooleanType */
export type ShowBooleanType = (typeof SHOW_BOOLEAN_TYPES)[number];

/** True iff the given string is a valid ShowBooleanType value. */
export function isShowBooleanType(value: string): value is ShowBooleanType {
  return (SHOW_BOOLEAN_TYPES as readonly string[]).includes(value);
}

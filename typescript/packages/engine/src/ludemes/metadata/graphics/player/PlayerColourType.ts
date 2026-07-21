/**
 * Defines the types of Player metadata depending of a colour.
 *
 * @java metadata/graphics/player/PlayerColourType.java
 */
export const PLAYER_COLOUR_TYPES = [
  /** To set the colour of a player. */
  "Colour",
] as const;

/** @java metadata/graphics/player/PlayerColourType.java — enum PlayerColourType */
export type PlayerColourType = (typeof PLAYER_COLOUR_TYPES)[number];

/** True iff the given string is a valid PlayerColourType value. */
export function isPlayerColourType(value: string): value is PlayerColourType {
  return (PLAYER_COLOUR_TYPES as readonly string[]).includes(value);
}

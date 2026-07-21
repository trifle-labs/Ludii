/**
 * Defines the types of Player metadata depending of a name.
 *
 * @java metadata/graphics/player/PlayerNameType.java
 */
export const PLAYER_NAME_TYPES = [
  /** To set the name of a player. */
  "Name",
] as const;

/** @java metadata/graphics/player/PlayerNameType.java — enum PlayerNameType */
export type PlayerNameType = (typeof PLAYER_NAME_TYPES)[number];

/** True iff the given string is a valid PlayerNameType value. */
export function isPlayerNameType(value: string): value is PlayerNameType {
  return (PLAYER_NAME_TYPES as readonly string[]).includes(value);
}

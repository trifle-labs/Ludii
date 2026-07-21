/**
 * Defines the possible types of pin that can occur in a game.
 *
 * @java game/types/play/PinType.java
 */
export const PIN_TYPES = [
  /**
   * For Shibumi games, that's not allowed to remove pieces if they are
   * supported by more than 1 piece.
   */
  "SupportMultiple",
] as const;

/** @java game/types/play/PinType.java — enum PinType */
export type PinType = (typeof PIN_TYPES)[number];

/** True iff the given string is a valid PinType value. */
export function isPinType(value: string): value is PinType {
  return (PIN_TYPES as readonly string[]).includes(value);
}

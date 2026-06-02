/**
 * Defines the possible conditions of piece stacking that can occur in a game.
 *
 * @java game/types/play/NoStackOnType.java
 */
export const NO_STACK_ON_TYPES = [
  /**
   * For Shibumi games, that's not allowed to put pieces on fallen ones.
   */
  "Fallen",
] as const;

/** @java game/types/play/NoStackOnType.java — enum NoStackOnType */
export type NoStackOnType = (typeof NO_STACK_ON_TYPES)[number];

/** True iff the given string is a valid NoStackOnType value. */
export function isNoStackOnType(value: string): value is NoStackOnType {
  return (NO_STACK_ON_TYPES as readonly string[]).includes(value);
}

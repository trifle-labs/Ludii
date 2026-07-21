/**
 * Defines the possible types of gravity that can occur in a game.
 *
 * @java game/types/play/GravityType.java
 */
export const GRAVITY_TYPES = [
  /** Gravity corresponding to pieces dropping in a pyramidal tilling. */
  "PyramidalDrop",
] as const;

/** @java game/types/play/GravityType.java — enum GravityType */
export type GravityType = (typeof GRAVITY_TYPES)[number];

/** True iff the given string is a valid GravityType value. */
export function isGravityType(value: string): value is GravityType {
  return (GRAVITY_TYPES as readonly string[]).includes(value);
}

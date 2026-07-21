/**
 * Defines the possible previous states to refer to.
 *
 * @java game/types/play/PrevType.java
 */
export const PREV_TYPES = [
  /** The state corresponding to the previous move. */
  "Mover",
  /** The state corresponding to the previous turn. */
  "MoverLastTurn",
] as const;

/** @java game/types/play/PrevType.java — enum PrevType */
export type PrevType = (typeof PREV_TYPES)[number];

/** True iff the given string is a valid PrevType value. */
export function isPrevType(value: string): value is PrevType {
  return (PREV_TYPES as readonly string[]).includes(value);
}

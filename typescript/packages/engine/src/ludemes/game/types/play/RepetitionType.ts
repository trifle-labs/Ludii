/**
 * Defines the possible types of repetition that can occur in a game.
 *
 * @java game/types/play/RepetitionType.java
 */
export const REPETITION_TYPES = [
  /** Situational State repeated within a turn. */
  "SituationalInTurn",
  /** Positional State repeated within a turn. */
  "PositionalInTurn",
  /** State repeated within a game (pieces on the board only). */
  "Positional",
  /** State repeated within a game (all data in the state). */
  "Situational",
] as const;

/** @java game/types/play/RepetitionType.java — enum RepetitionType */
export type RepetitionType = (typeof REPETITION_TYPES)[number];

/** True iff the given string is a valid RepetitionType value. */
export function isRepetitionType(value: string): value is RepetitionType {
  return (REPETITION_TYPES as readonly string[]).includes(value);
}

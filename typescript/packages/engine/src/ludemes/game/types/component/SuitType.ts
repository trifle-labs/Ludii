/**
 * Defines the possible suit types of cards.
 *
 * @java game/types/component/SuitType.java
 */

/** A single suit entry with its ordinal value. */
export interface SuitTypeEntry {
  /** The corresponding value. @java SuitType.value */
  readonly value: number;
}

/** @java game/types/component/SuitType.java — enum SuitType */
export const SuitType = {
  /** Club suit. */
  Clubs:    { value: 1 },
  /** Spade suit. */
  Spades:   { value: 2 },
  /** Diamond suit. */
  Diamonds: { value: 3 },
  /** Heart suit. */
  Hearts:   { value: 4 },
} as const satisfies Record<string, SuitTypeEntry>;

/** The name of a card suit. @java game/types/component/SuitType.java — enum member names */
export type SuitTypeName = keyof typeof SuitType;

/** True iff the given string is a valid SuitTypeName. */
export function isSuitTypeName(value: string): value is SuitTypeName {
  return Object.prototype.hasOwnProperty.call(SuitType, value);
}

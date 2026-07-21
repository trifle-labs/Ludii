/**
 * Defines possible rank values of cards.
 *
 * @java game/types/component/CardType.java
 */

/** A single card type entry with its numeric value and label. */
export interface CardTypeEntry {
  /** Default number shown on the card, if any. @java CardType.number */
  readonly number: number;
  /** Common name of the card. @java CardType.label */
  readonly label: string;
  /** @java CardType.isRoyal() — true for Jack, Queen, King, Joker */
  readonly isRoyal: boolean;
}

/** @java game/types/component/CardType.java — enum CardType */
export const CardType = {
  /** Joker rank. */
  Joker:  { number:  0, label: "?",  isRoyal: true  },
  /** Ace rank. */
  Ace:    { number:  1, label: "A",  isRoyal: false },
  /** Two rank. */
  Two:    { number:  2, label: "2",  isRoyal: false },
  /** Three rank. */
  Three:  { number:  3, label: "3",  isRoyal: false },
  /** Four rank. */
  Four:   { number:  4, label: "4",  isRoyal: false },
  /** Five rank. */
  Five:   { number:  5, label: "5",  isRoyal: false },
  /** Six rank. */
  Six:    { number:  6, label: "6",  isRoyal: false },
  /** Seven rank. */
  Seven:  { number:  7, label: "7",  isRoyal: false },
  /** Eight rank. */
  Eight:  { number:  8, label: "8",  isRoyal: false },
  /** Nine rank. */
  Nine:   { number:  9, label: "9",  isRoyal: false },
  /** Ten rank. */
  Ten:    { number: 10, label: "10", isRoyal: false },
  /** Jack rank. */
  Jack:   { number: 10, label: "J",  isRoyal: true  },
  /** Queen rank. */
  Queen:  { number: 10, label: "Q",  isRoyal: true  },
  /** King rank. */
  King:   { number: 10, label: "K",  isRoyal: true  },
} as const satisfies Record<string, CardTypeEntry>;

/** The name of a card rank. @java game/types/component/CardType.java — enum member names */
export type CardTypeName = keyof typeof CardType;

/** True iff the given string is a valid CardTypeName. */
export function isCardTypeName(value: string): value is CardTypeName {
  return Object.prototype.hasOwnProperty.call(CardType, value);
}

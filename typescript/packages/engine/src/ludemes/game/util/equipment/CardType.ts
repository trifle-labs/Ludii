// @java Core/src/game/types/component/CardType.java
//
// Defines possible rank values of playing cards.

/**
 * Card rank/type values.
 *
 * @java game.types.component.CardType
 */
export enum CardType {
  Joker = 0,
  Ace = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10,
  Jack = 11,
  Queen = 12,
  King = 13,
}

/** Default number shown on each card type. @java CardType.number() */
const CARD_NUMBER: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10];

/** Short label for each card type. @java CardType.label() */
const CARD_LABEL: readonly string[] = ["?", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

/** @java CardType.label() — common name of the card. */
export function cardLabel(type: CardType): string {
  return CARD_LABEL[type] ?? "?";
}

/** @java CardType.number() — default number shown on the card. */
export function cardNumber(type: CardType): number {
  return CARD_NUMBER[type] ?? 0;
}

/** @java CardType.isRoyal() — true for Jack, Queen, King, Joker. */
export function isRoyal(type: CardType): boolean {
  return type === CardType.Jack || type === CardType.Queen ||
         type === CardType.King || type === CardType.Joker;
}

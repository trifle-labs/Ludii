/**
 * @java game/equipment/container/other/Deck.java Deck
 *
 * A deck of playing cards.  Stores per-suit card metadata and exposes a
 * generateCards() method that produces the full list of Card1to1 objects.
 *
 * @java game/equipment/container/other/Deck.java — constructor/generateCards/ranks/values/suits/types
 */

import { Item1to1 } from "../../Item1to1.js";
import { Card1to1 } from "../../component/Card1to1.js";
import type { CardType } from "../../component/Card1to1.js";

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/** All CardType values in declaration order (matches Java's CardType.values()). */
const CARD_TYPE_VALUES: CardType[] = [
  "Ace", "Two", "Three", "Four", "Five",
  "Six", "Seven", "Eight", "Nine", "Ten",
  "Jack", "Queen", "King", "Joker",
];

export class Deck1to1 extends Item1to1 {
  /** @java Deck.cardsBySuit */
  public readonly cardsBySuit: number;
  /** @java Deck.suits */
  public readonly suits: number;
  /** @java Deck.ranks */
  private readonly _ranks: readonly number[];
  /** @java Deck.values */
  private readonly _values: readonly number[];
  /** @java Deck.trumpRanks */
  private readonly _trumpRanks: readonly number[];
  /** @java Deck.trumpValues */
  private readonly _trumpValues: readonly number[];
  /** @java Deck.biased */
  private readonly _biased: readonly number[] | null;
  /** @java Deck.types */
  private readonly _types: readonly (CardType | null)[];

  /**
   * @java game/equipment/container/other/Deck.java constructor
   *
   * Mirrors Java constructor logic for the two overloads (default deck and
   * custom cards array). Only the "cards" overload is relevant here; the
   * default 52-card deck is what Ludii generates when no cards are given.
   *
   * @param role         1-based player owner (0 = Shared).
   * @param cardsBySuit  Number of cards per suit [13].
   * @param suits        Number of suits [4].
   * @param cards        Custom per-card data (null → default sequential values).
   */
  public constructor(
    role: number,
    cardsBySuit: number | null,
    suits: number | null,
    cards: Array<{
      value: number;
      trumpValue: number;
      rank: number;
      trumpRank: number;
      biased: number;
      type: CardType | null;
    }> | null,
  ) {
    super(null, UNDEFINED, role);
    this.setType("Hand");
    this.setName("Deck" + role);

    // @java Deck.java:126–128 — cardsBySuit
    this.cardsBySuit =
      (cardsBySuit === null && cards === null) ? 13
      : cards !== null ? cards.length
      : cardsBySuit!;

    // @java Deck.java:129 — suits
    this.suits = (suits === null) ? 4 : suits;

    // @java Deck.java:131–148 — extract per-card arrays
    if (cards !== null) {
      this._values      = cards.map(c => c.value);
      this._trumpValues = cards.map(c => c.trumpValue);
      this._ranks       = cards.map(c => c.rank);
      this._trumpRanks  = cards.map(c => c.trumpRank);
      this._biased      = cards.map(c => c.biased);
      this._types       = cards.map(c => c.type);
    } else {
      // @java Deck.java:150–155 — default: val[i] = i+1
      const defaultVals = Array.from({ length: this.cardsBySuit }, (_, i) => i + 1);
      this._values      = defaultVals;
      this._trumpValues = defaultVals;
      this._ranks       = defaultVals;
      this._trumpRanks  = defaultVals;
      this._biased      = null;
      // @java Deck.java:157–161 — typeOfCards[i] = CardType.values()[i+1]
      this._types = Array.from({ length: this.cardsBySuit }, (_, i) =>
        CARD_TYPE_VALUES[i + 1] ?? null,
      );
    }
  }

  /** @java Deck.ranks() */
  public ranks(): readonly number[]            { return this._ranks; }
  /** @java Deck.values() */
  public values(): readonly number[]           { return this._values; }
  /** @java Deck.trumpValues() */
  public trumpValues(): readonly number[]      { return this._trumpValues; }
  /** @java Deck.trumpRanks() */
  public trumpRanks(): readonly number[]       { return this._trumpRanks; }
  /** @java Deck.getBiased() */
  public getBiased(): readonly number[] | null { return this._biased; }
  /** @java Deck.types() */
  public types(): readonly (CardType | null)[] { return this._types; }

  /** @java Deck.isDeck() */
  public isDeck(): boolean { return true; }
  /** @java Deck.isHand() */
  public isHand(): boolean { return true; }

  /**
   * @java Deck.generateCards(int indexCard, int cid)
   *
   * Generates all Card1to1 components for this deck, assigning sequential
   * component indices starting at `cid`.
   *
   * @param indexCard Starting card-name counter.
   * @param cid       Starting 1-based component index.
   * @returns Array of Card1to1 components (suits × cardsBySuit entries).
   */
  public generateCards(indexCard: number, cid: number): Card1to1[] {
    // @java Deck.java:256–277 — generateCards
    const cards: Card1to1[] = [];
    let i          = cid;
    let cardIndex  = indexCard;

    for (let indexSuit = 1; indexSuit <= this.suits; indexSuit++) {
      for (let indexCardSuit = 0; indexCardSuit < this.cardsBySuit; indexCardSuit++) {
        const card = new Card1to1(
          "Card" + cardIndex,
          this.owner(),
          this._types[indexCardSuit] ?? null,
          this._ranks[indexCardSuit] ?? UNDEFINED,
          this._values[indexCardSuit] ?? 0,
          this._trumpRanks[indexCardSuit] ?? UNDEFINED,
          this._trumpValues[indexCardSuit] ?? UNDEFINED,
          indexSuit,
          null,   // no generator
          null,
          null,
          null,
        );
        card.index = i;
        cards.push(card);
        i++;
        cardIndex++;
      }
    }
    return cards;
  }
}

/**
 * Card1to1.ts
 * @java game/util/equipment/Card.java
 *
 * Defines an instance of a playing card.
 * Holds rank, value, trumpRank, trumpValue, biased, and type.
 *
 * This is a data class — no eval(ctx).
 */

/** Constants.UNDEFINED mirrors Java's Constants.UNDEFINED = -1. */
const UNDEFINED = -1;

/**
 * Card type names (mirrors Java's CardType enum).
 * @java game/types/component/CardType.java
 */
export type CardType1to1 =
  | "Ace" | "Two" | "Three" | "Four" | "Five" | "Six" | "Seven"
  | "Eight" | "Nine" | "Ten" | "Jack" | "Queen" | "King"
  | "Joker" | string;

/**
 * Defines an instance of a playing card.
 * @java game/util/equipment/Card.java
 */
export class Card1to1 {
  /** @java Card.rank — the rank of the card. */
  private readonly rankValue: number;

  /** @java Card.value — the value of the card. */
  private readonly cardValue: number;

  /** @java Card.trumpRank — the trump rank (defaults to rank). */
  private readonly trumpRankValue: number;

  /** @java Card.trumpValue — the trump value (defaults to value). */
  private readonly trumpValueValue: number;

  /** @java Card.biased — the biased value (defaults to UNDEFINED = -1). */
  private readonly biasedValue: number;

  /** @java Card.type — the type of the card. */
  private readonly cardType: CardType1to1;

  /**
   * @java game/util/equipment/Card.java — constructor
   *
   * Java: trumpRank defaults to rank if null; trumpValue defaults to value if null;
   * biased defaults to Constants.UNDEFINED (-1) if null.
   */
  public constructor(opts: {
    type: CardType1to1;
    rank: number;
    value: number;
    trumpRank?: number | null;
    trumpValue?: number | null;
    biased?: number | null;
  }) {
    this.cardType = opts.type;
    this.rankValue = opts.rank;
    this.cardValue = opts.value;
    this.trumpRankValue = opts.trumpRank ?? opts.rank;
    this.trumpValueValue = opts.trumpValue ?? opts.value;
    this.biasedValue = opts.biased ?? UNDEFINED;
  }

  /** @java Card.type() */
  public type(): CardType1to1 {
    return this.cardType;
  }

  /** @java Card.rank() */
  public rank(): number {
    return this.rankValue;
  }

  /** @java Card.value() */
  public value(): number {
    return this.cardValue;
  }

  /** @java Card.trumpRank() */
  public trumpRank(): number {
    return this.trumpRankValue;
  }

  /** @java Card.trumpValue() */
  public trumpValue(): number {
    return this.trumpValueValue;
  }

  /** @java Card.biased() */
  public biased(): number {
    return this.biasedValue;
  }
}

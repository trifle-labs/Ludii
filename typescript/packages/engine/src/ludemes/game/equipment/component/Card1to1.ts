/**
 * @java game/equipment/component/Card.java Card
 *
 * A playing card component with suit, rank, trump-rank, trump-value, value,
 * and card-type metadata. Extends Component1to1.
 *
 * @java game/equipment/component/Card.java — constructor/suit/rank/trumpValue/trumpRank/value/cardType
 */

import { Component1to1 } from "./Component1to1.js";
import type { MovesFunction } from "../../../base.js";

/**
 * Mirrors Java's game.types.component.CardType enum.
 * The values are the standard playing-card rank names Ludii ships with.
 */
export type CardType =
  | "Ace" | "Two" | "Three" | "Four" | "Five"
  | "Six" | "Seven" | "Eight" | "Nine" | "Ten"
  | "Jack" | "Queen" | "King" | "Joker";

export class Card1to1 extends Component1to1 {
  /** @java Card.suit */
  private readonly _suit: number;
  /** @java Card.rank */
  private readonly _rank: number;
  /** @java Card.value */
  private readonly _value: number;
  /** @java Card.trumpRank */
  private readonly _trumpRank: number;
  /** @java Card.trumpValue */
  private readonly _trumpValue: number;
  /** @java Card.cardType */
  private readonly _cardType: CardType | null;

  /**
   * @java game/equipment/component/Card.java constructor
   *
   * Mirrors Java parameter order exactly.
   *
   * @param label      Piece name (e.g. "Card1").
   * @param owner      1-based player owner (0 = Shared/Neutral).
   * @param cardType   CardType enum value (may be null).
   * @param rank       Rank of the card in deck (OFF if absent).
   * @param value      Face value.
   * @param trumpRank  Trump rank (OFF if absent).
   * @param trumpValue Trump value (OFF if absent).
   * @param suit       Suit index (OFF if absent).
   * @param generator  Optional move generator.
   * @param maxState   Max local state (-1 = unused).
   * @param maxCount   Max count (-1 = unused).
   * @param maxValue   Max value (-1 = unused).
   */
  public constructor(
    label: string,
    owner: number,
    cardType: CardType | null,
    rank: number | null,
    value: number,
    trumpRank: number | null,
    trumpValue: number | null,
    suit: number | null,
    generator: MovesFunction | null = null,
    maxState: number | null = null,
    maxCount: number | null = null,
    maxValue: number | null = null,
  ) {
    super(
      label,
      owner,
      maxState ?? Component1to1.OFF,
      maxCount ?? Component1to1.OFF,
      maxValue ?? Component1to1.OFF,
      generator,
    );
    // @java Card.java — null → Constants.OFF for suit/rank/trumpRank/trumpValue
    this._suit       = suit       ?? Component1to1.OFF;
    this._rank       = rank       ?? Component1to1.OFF;
    this._trumpRank  = trumpRank  ?? Component1to1.OFF;
    this._trumpValue = trumpValue ?? Component1to1.OFF;
    this._value      = value;
    this._cardType   = cardType;
    // @java Card.java — style = ComponentStyleType.Card
    this.style = "Card";
  }

  /** @java Card.isCard() */
  public override isCard(): boolean { return true; }

  /** @java Card.suit() */
  public override suit(): number      { return this._suit; }
  /** @java Card.rank() */
  public override rank(): number      { return this._rank; }
  /** @java Card.getValue() */
  public override getValue(): number  { return this._value; }
  /** @java Card.trumpValue() */
  public override trumpValue(): number { return this._trumpValue; }
  /** @java Card.trumpRank() */
  public override trumpRank(): number  { return this._trumpRank; }
  /** @java Card.cardType() */
  public cardType(): CardType | null   { return this._cardType; }
}

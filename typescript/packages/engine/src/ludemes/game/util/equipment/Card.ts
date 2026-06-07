// @java Core/src/game/util/equipment/Card.java
//
// Faithful port of the Card data class. Carries rank, value, trumpRank,
// trumpValue, biased, and CardType. All fields are readonly after construction.

import { type CardTypeName } from "../../types/component/CardType.js";

export type CardType = CardTypeName;

/** Sentinel for undefined integer — matches Java Constants.UNDEFINED = -1. */
const UNDEFINED = -1;

/**
 * Defines an instance of a playing card.
 *
 * @java game.util.equipment.Card
 */
export class Card {
  /** The rank of the card. @java Card.rank */
  public readonly rank: number;

  /** The value of the card. @java Card.value */
  public readonly value: number;

  /** The trump rank of the card. @java Card.trumpRank */
  public readonly trumpRank: number;

  /** The trump value of the card. @java Card.trumpValue */
  public readonly trumpValue: number;

  /** The biased value of the card. @java Card.biased */
  public readonly biased: number;

  /** The type of the card. @java Card.type */
  public readonly type: CardType;

  /**
   * @java Card(CardType type, @Name Integer rank, @Name Integer value,
   *            @Opt @Name Integer trumpRank, @Opt @Name Integer trumpValue,
   *            @Opt @Name Integer biased)
   *
   * @param type       The type of the card.
   * @param rank       The rank of the card.
   * @param value      The value of the card.
   * @param trumpRank  The trump rank (defaults to rank).
   * @param trumpValue The trump value (defaults to value).
   * @param biased     The biased value (defaults to UNDEFINED = -1).
   */
  public constructor(
    type: CardType,
    rank: number,
    value: number,
    trumpRank?: number,
    trumpValue?: number,
    biased?: number,
  ) {
    this.type = type;
    this.rank = rank;
    this.value = value;
    this.trumpRank = trumpRank ?? rank;
    this.trumpValue = trumpValue ?? value;
    this.biased = biased ?? UNDEFINED;
  }
}

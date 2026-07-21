// @java Core/src/game/functions/ints/card/CardSiteType.java

/**
 * Defines the types of properties which can be returned for the Card super
 * ludeme according an index and optionally a level.
 *
 * @java game/functions/ints/card/CardSiteType.java
 * @author Eric.Piette
 */
export enum CardSiteType {
  /** To return the rank of a card. */
  Rank = "Rank",

  /** To return the suit of a card. */
  Suit = "Suit",

  /** To return the value of the trump of a card. */
  TrumpValue = "TrumpValue",

  /** To return the rank of the trump of a card. */
  TrumpRank = "TrumpRank",
}

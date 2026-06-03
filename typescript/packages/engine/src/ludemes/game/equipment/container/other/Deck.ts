/**
 * @java game/equipment/container/other/Deck.java Deck
 *
 * A deck of playing cards. Stores per-suit card metadata (ranks, values,
 * trumpRanks, trumpValues, types, biased) and exposes a generateCards() method
 * that produces the full list of Card objects.
 *
 * @java game/equipment/container/other/Deck.java — constructor/generateCards/ranks/values/suits/types/biased
 */

import { Item, type RoleType, type GameLike } from "../../Item.js";
import { Card, type CardType } from "../../component/Card.js";

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/** Java Constants.MAX_PLAYERS = 8 */
const MAX_PLAYERS = 8;

/**
 * CardType enum values in Java declaration order (CardType.values()).
 * Index 0 = Joker, 1 = Ace, 2 = Two, …, 13 = King.
 * @java game.types.component.CardType.values()
 */
const CARD_TYPE_VALUES: CardType[] = [
  "Joker",
  "Ace", "Two", "Three", "Four", "Five",
  "Six", "Seven", "Eight", "Nine", "Ten",
  "Jack", "Queen", "King",
];

/**
 * Per-card data record supplied by the (card …) ludeme inside (deck …).
 * @java game.util.equipment.Card
 */
export interface CardData {
  readonly value: number;
  readonly trumpValue: number;
  readonly rank: number;
  readonly trumpRank: number;
  readonly biased: number;
  readonly type: CardType | null;
}

/**
 * A deck of playing cards container.
 * @java game.equipment.container.other.Deck
 */
export class Deck extends Item {
  /** @java Deck.cardsBySuit — number of cards per suit */
  public readonly cardsBySuit: number;

  /** @java Deck.suits — number of suits */
  public readonly suits: number;

  /** @java Deck.ranks — ranks of each card */
  private _ranks: number[];

  /** @java Deck.values — values of each card */
  private _values: number[];

  /** @java Deck.trumpRanks — trump ranks of each card */
  private _trumpRanks: number[];

  /** @java Deck.trumpValues — trump values of each card */
  private _trumpValues: number[];

  /** @java Deck.biased — biased values (null if not specified) */
  private _biased: number[] | null;

  /** @java Deck.types — CardType per card */
  private _types: (CardType | null)[];

  /** @java Deck.indexComponent — component indices in this deck */
  private readonly _indexComponent: number[];

  /** @java Deck.numLocs — number of locations in this container */
  protected numLocs: number;

  /**
   * @java game/equipment/container/other/Deck.java constructor
   *
   * @param role        The owner role [Shared].
   * @param cardsBySuit Number of cards per suit [13].
   * @param suits       Number of suits in the deck [4].
   * @param cards       Specific card data records (null → default 52-card deck).
   */
  public constructor(
    role: RoleType | null,
    cardsBySuit: number | null,
    suits: number | null,
    cards: readonly CardData[] | null,
  ) {
    // @java Deck.java:98 — super(null, Constants.UNDEFINED, (role == null) ? RoleType.Shared : role)
    const realRole: RoleType = (role === null) ? "Shared" : role;
    super(null, UNDEFINED, realRole);

    // @java Deck.java:100–119 — set name based on role
    const containerName = "Deck";
    const roleOwnerVal = Deck._roleOwner(realRole);
    if (roleOwnerVal > 0 && roleOwnerVal <= MAX_PLAYERS) {
      if (this.name() === null) {
        this.setName(containerName + roleOwnerVal);
      }
    } else if (realRole === "Neutral") {
      if (this.name() === null) {
        this.setName(containerName + roleOwnerVal);
      }
    } else if (realRole === "Shared") {
      if (this.name() === null) {
        this.setName(containerName + roleOwnerVal);
      }
    }

    this.numLocs = 1;

    // @java Deck.java:122 — style = ContainerStyleType.Hand; setType(ItemType.Hand)
    this.setType("Hand");

    // @java Deck.java:126–128 — cardsBySuit
    this.cardsBySuit =
      (cardsBySuit === null && cards === null) ? 13
      : cards !== null ? cards.length
      : cardsBySuit!;

    // @java Deck.java:129 — suits
    this.suits = (suits === null) ? 4 : suits;

    // @java Deck.java:131–148 — extract per-card arrays from cards[]
    let valuesOfCards: number[] | null           = null;
    let trumpValuesOfCards: number[] | null      = null;
    let ranksOfCards: number[] | null            = null;
    let trumpRanksOfCards: number[] | null       = null;
    let biasedValuesOfCards: number[] | null     = null;
    let typeOfCards: (CardType | null)[] | null  = null;

    if (cards !== null) {
      valuesOfCards      = [];
      trumpValuesOfCards = [];
      ranksOfCards       = [];
      trumpRanksOfCards  = [];
      biasedValuesOfCards= [];
      typeOfCards        = [];
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        if (card === undefined) continue;
        valuesOfCards.push(card.value);
        trumpValuesOfCards.push(card.trumpValue);
        ranksOfCards.push(card.rank);
        biasedValuesOfCards.push(card.biased);
        trumpRanksOfCards.push(card.trumpRank);
        typeOfCards.push(card.type);
      }
    }

    // @java Deck.java:150–155 — default sequential values if val[0] == null
    const val: number[] = (valuesOfCards === null)
      ? new Array(this.cardsBySuit)
      : valuesOfCards;
    if (val[0] === undefined || val[0] === null) {
      for (let i = 1; i <= this.cardsBySuit; i++) {
        val[i - 1] = i;
      }
    }

    // @java Deck.java:157–161 — default CardType array
    if (typeOfCards === null) {
      typeOfCards = new Array(this.cardsBySuit);
      for (let i = 1; i <= this.cardsBySuit; i++) {
        typeOfCards[i - 1] = CARD_TYPE_VALUES[i] ?? null;
      }
    }

    this._types       = typeOfCards;
    this._values      = val;
    this._trumpValues = (trumpValuesOfCards === null) ? [...val] : trumpValuesOfCards;
    this._trumpRanks  = (trumpRanksOfCards === null)  ? [...val] : trumpRanksOfCards;
    this._ranks       = (ranksOfCards === null)       ? [...val] : ranksOfCards;
    this._biased      = biasedValuesOfCards;
    this._indexComponent = [];
  }

  /** Maps a RoleType to its numeric owner ID (for name-setting purposes). */
  private static _roleOwner(role: RoleType): number {
    const map: Partial<Record<RoleType, number>> = {
      Neutral: 0, P1: 1, P2: 2, P3: 3, P4: 4, P5: 5, P6: 6, P7: 7, P8: 8,
    };
    return map[role] ?? -1;
  }

  /** @java Deck.clone() */
  public clone(): Deck {
    const d = new Deck(this.role(), this.cardsBySuit, this.suits, null);
    // re-assign the arrays from our own copies
    d._ranks       = [...this._ranks];
    d._values      = [...this._values];
    d._trumpRanks  = [...this._trumpRanks];
    d._trumpValues = [...this._trumpValues];
    d._biased      = this._biased ? [...this._biased] : null;
    d._types       = [...this._types];
    return d;
  }

  /**
   * @java Deck.generateCards(int indexCard, int cid)
   *
   * Generates all Card components for this deck.
   *
   * @param indexCard Starting card-name counter.
   * @param cid       Starting 1-based component index.
   * @returns Array of Card components (suits × cardsBySuit entries).
   */
  public generateCards(indexCard: number, cid: number): Card[] {
    // @java Deck.java:256–277
    const cards: Card[] = [];
    let i         = cid;
    let cardIndex = indexCard;

    for (let indexSuit = 1; indexSuit <= this.suits; indexSuit++) {
      for (let indexCardSuit = 0; indexCardSuit < this.cardsBySuit; indexCardSuit++) {
        const card = new Card(
          "Card" + cardIndex,
          this.role(),
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
        card.setIndex(i);
        cards.push(card);
        this._indexComponent.push(i);
        i++;
        cardIndex++;
      }
    }
    return cards;
  }

  /** @java Deck.getBiased() */
  public getBiased(): number[] | null { return this._biased; }

  /** @java Deck.ranks() */
  public ranks(): number[] { return this._ranks; }

  /** @java Deck.values() */
  public values(): number[] { return this._values; }

  /** @java Deck.suits() as field — provided as accessor */
  public suitsCount(): number { return this.suits; }

  /** @java Deck.types() */
  public types(): (CardType | null)[] { return this._types; }

  /** @java Deck.cardsBySuits() */
  public cardsBySuits(): number { return this.cardsBySuit; }

  /** @java Deck.trumpValues() */
  public trumpValues(): number[] { return this._trumpValues; }

  /** @java Deck.trumpRanks() */
  public trumpRanks(): number[] { return this._trumpRanks; }

  /** @java Deck.indexComponent() */
  public indexComponent(): number[] { return this._indexComponent; }

  /** @java Deck.isDeck() */
  public isDeck(): boolean { return true; }

  /** @java Deck.isHand() */
  public isHand(): boolean { return true; }

  /**
   * @java Deck.numLocs() — static in Java; returns 1.
   */
  public static numLocsStatic(): number { return 1; }

  /**
   * @java Deck.missingRequirement(Game)
   * Reports a missing-requirement error if the owner role is invalid.
   */
  public missingRequirement(
    game: GameLike & { addRequirementToReport?: (msg: string) => void; players(): { count(): number } },
  ): boolean {
    let missingRequirement = false;
    const role = this.role();
    if (role !== null) {
      const indexOwnerPhase = Deck._roleOwner(role);
      if (
        (
          indexOwnerPhase < 1 &&
          role !== "Shared" &&
          role !== "Neutral" &&
          role !== "All"
        ) ||
        indexOwnerPhase > game.players().count()
      ) {
        game.addRequirementToReport?.(
          "A deck is defined in the equipment with an incorrect owner: " + role + ".",
        );
        missingRequirement = true;
      }
    }
    return missingRequirement;
  }
}

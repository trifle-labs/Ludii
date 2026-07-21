/**
 * @java game/equipment/component/Card.java Card
 *
 * A playing card component with suit, rank, trump-rank, trump-value, value,
 * and card-type metadata. Extends Component (which extends Item).
 *
 * @java game/equipment/component/Component.java — base fields
 * @java game/equipment/component/Card.java — constructor/suit/rank/trumpValue/trumpRank/value/cardType
 */

import { Item, type RoleType as ItemRoleType, type GameLike } from "../Item.js";
import type { MovesFunction } from "../../../base.js";
import { RoleTypeValues, type RoleTypeFull } from "../../types/play/RoleType.js";
import type { CardTypeName } from "../../types/component/CardType.js";

/** Java Constants.OFF = -1 */
const OFF = -1;

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Mirrors Java's metadata.graphics.util.ComponentStyleType.
 * @java metadata.graphics.util.ComponentStyleType
 */
export type ComponentStyleType =
  | "Piece" | "Card" | "Die" | "Domino" | "Tile" | "LargePiece" | "Hand";

/** @java game.types.component.CardType — enum member name strings. */
export type CardType = CardTypeName;

/** @java game.types.play.RoleType — enum member name strings. */
export type RoleType = RoleTypeFull | ItemRoleType;

/**
 * Abstract component base, mirroring Java's Component class (subset of fields
 * needed for Card). Extends Item.
 *
 * @java game/equipment/component/Component.java
 */
abstract class Component extends Item {
  /** @java Component.generator — optional move generator */
  public generator: MovesFunction | null;

  /** @java Component.nameWithoutNumber */
  public nameWithoutNumber: string;

  /** @java Component.style */
  protected style: ComponentStyleType;

  /** @java Component.maxState */
  public readonly maxState: number;

  /** @java Component.maxCount */
  public readonly maxCount: number;

  /** @java Component.maxValue */
  public readonly maxValue: number;

  /**
   * @java game/equipment/component/Component.java constructor
   */
  protected constructor(
    label: string | null,
    role: RoleType,
    generator: MovesFunction | null,
    maxState: number | null,
    maxCount: number | null,
    maxValue: number | null,
  ) {
    super(label, UNDEFINED, role as ItemRoleType);
    this.generator         = generator;
    this.nameWithoutNumber = (label ?? "").replace(/\d+$/, "");
    this.style             = "Piece";
    this.maxState          = maxState !== null ? maxState : OFF;
    this.maxCount          = maxCount !== null ? maxCount : OFF;
    this.maxValue          = maxValue !== null ? maxValue : OFF;
    this.setType("Component");
  }

  /** @java Component.isCard() */
  public isCard(): boolean  { return false; }
  /** @java Component.isDie() */
  public isDie(): boolean   { return false; }
  /** @java Component.isDomino() */
  public isDomino(): boolean { return false; }
  /** @java Component.isTile() */
  public isTile(): boolean  { return false; }
  /** @java Component.getValue() */
  public getValue(): number { return OFF; }
  /** @java Component.suit() */
  public suit(): number     { return OFF; }
  /** @java Component.rank() */
  public rank(): number     { return OFF; }
  /** @java Component.trumpValue() */
  public trumpValue(): number { return OFF; }
  /** @java Component.trumpRank() */
  public trumpRank(): number  { return OFF; }
  /** @java Component.cardType() */
  public cardType(): CardType | null { return null; }
  /** @java Component.style() */
  public styleType(): ComponentStyleType { return this.style; }
  /** @java Component.missingRequirement(Game) */
  public missingRequirement(_game: GameLike & { addRequirementToReport?: (msg: string) => void }): boolean {
    return false;
  }
}

/**
 * A playing card component.
 * @java game.equipment.component.Card
 */
export class Card extends Component {
  /** @java Card.trumpValue */
  private readonly _trumpValue: number;

  /** @java Card.suit */
  private readonly _suit: number;

  /** @java Card.trumpRank */
  private readonly _trumpRank: number;

  /** @java Card.rank */
  private readonly _rank: number;

  /** @java Card.value */
  private readonly _value: number;

  /** @java Card.cardType */
  private readonly _cardType: CardType | null;

  /**
   * @java game/equipment/component/Card.java constructor
   *
   * @param label      The name of the card.
   * @param role       The owner of the card.
   * @param cardType   The type of a card (CardType enum value).
   * @param rank       The rank of the card in the deck.
   * @param value      The value of the card.
   * @param trumpRank  The trump rank of the card in the deck.
   * @param trumpValue The trump value of the card.
   * @param suit       The suit of the card.
   * @param generator  The moves associated with the component.
   * @param maxState   Max local state (-1 = unused).
   * @param maxCount   Max count (-1 = unused).
   * @param maxValue   Max value (-1 = unused).
   */
  public constructor(other: Card);
  public constructor(
    label: string,
    role: RoleType,
    cardType: CardType | null,
    rank: number | null,
    value: number,
    trumpRank: number | null,
    trumpValue: number | null,
    suit: number | null,
    generator?: MovesFunction | null,
    maxState?: number | null,
    maxCount?: number | null,
    maxValue?: number | null,
  );
  public constructor(
    labelOrOther: string | Card,
    role: RoleType | null = null,
    cardType: CardType | null = null,
    rank: number | null = null,
    value: number | null = null,
    trumpRank: number | null = null,
    trumpValue: number | null = null,
    suit: number | null = null,
    generator: MovesFunction | null = null,
    maxState: number | null = null,
    maxCount: number | null = null,
    maxValue: number | null = null,
  ) {
    if (labelOrOther instanceof Card) {
      const other = labelOrOther;
      super(other.name(), other.role() as RoleType, other.generator, other.maxState, other.maxCount, other.maxValue);
      this._trumpValue = other._trumpValue;
      this._suit       = other._suit;
      this._trumpRank  = other._trumpRank;
      this._rank       = other._rank;
      this._value      = other._value;
      this._cardType   = other._cardType;
      this.style       = "Card";
      return;
    }

    super(labelOrOther, role as RoleType, generator, maxState, maxCount, maxValue);

    // @java Card.java:86–91
    this._trumpValue = (trumpValue === null) ? OFF : trumpValue;
    this._suit       = (suit       === null) ? OFF : suit;
    // @java Card.java:88 — trumpRank guards on trumpValue (not suit) in the Java source
    this._trumpRank  = (trumpValue === null) ? OFF : trumpRank!;
    this._rank       = (suit       === null) ? OFF : rank!;
    this._cardType   = cardType;
    this._value      = value!;

    // @java Card.java:93 — style = ComponentStyleType.Card
    this.style = "Card";
  }

  /** @java Card.clone() */
  public clone(): Card {
    return new Card(this);
  }

  /** @java Card.isCard() */
  public override isCard(): boolean { return true; }

  /** @java Card.suit() */
  public override suit(): number      { return this._suit; }

  /** @java Card.getValue() */
  public override getValue(): number  { return this._value; }

  /** @java Card.trumpValue() */
  public override trumpValue(): number { return this._trumpValue; }

  /** @java Card.rank() */
  public override rank(): number      { return this._rank; }

  /** @java Card.trumpRank() */
  public override trumpRank(): number  { return this._trumpRank; }

  /** @java Card.cardType() */
  public override cardType(): CardType | null { return this._cardType; }

  /**
   * @java Card.missingRequirement(Game)
   * Reports a missing-requirement error if the owner role is invalid.
   */
  public override missingRequirement(
    game: GameLike & { addRequirementToReport?: (msg: string) => void; players(): { count(): number } },
  ): boolean {
    let missingRequirement = false;
    const role = this.role();
    if (role !== null) {
      // Derive numeric owner index for validation
      const numericRoles: Record<string, number> = {
        P1: 1, P2: 2, P3: 3, P4: 4, P5: 5, P6: 6, P7: 7, P8: 8, Neutral: 0,
      };
      const roleName = role as string;
      const indexOwnerPhase =
        roleName in RoleTypeValues
          ? RoleTypeValues[roleName as RoleTypeFull].owner
          : (numericRoles[roleName] ?? -1);
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
          "A card is defined in the equipment with an incorrect owner: " + role + ".",
        );
        missingRequirement = true;
      }
    }
    return missingRequirement;
  }
}

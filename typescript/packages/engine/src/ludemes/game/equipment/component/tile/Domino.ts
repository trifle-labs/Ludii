/**
 * @java game/equipment/component/tile/Domino.java Domino
 *
 * A single domino tile component with two pip values.
 * isTile() = true, isDomino() = true, numSides() = 4.
 * isDoubleDomino() returns true iff both values are equal.
 *
 * @java game/equipment/component/Component.java — base fields
 * @java game/equipment/component/tile/Domino.java — constructor/getValue/getValue2/isDoubleDomino/isTile/isDomino/numSides
 */

import { Item, type RoleType, type GameLike } from "../../Item.js";
import type { MovesFunction } from "../../../../base.js";

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

/**
 * Abstract component base mirroring Java's Component class (fields needed for
 * Domino). Extends Item.
 *
 * @java game/equipment/component/Component.java
 */
abstract class Component extends Item {
  /** @java Component.generator — optional move generator */
  protected _generator: MovesFunction | null;

  /** @java Component.generator() */
  public generator(): MovesFunction | null {
    return this._generator;
  }

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
    super(label, UNDEFINED, role);
    this._generator        = generator;
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
  /** @java Component.getValue2() */
  public getValue2(): number { return OFF; }
  /** @java Component.numSides() */
  public numSides(): number { return OFF; }
  /** @java Component.isDoubleDomino() */
  public isDoubleDomino(): boolean { return false; }
  /** @java Component.styleType() */
  public styleType(): ComponentStyleType { return this.style; }
  /** @java Component.missingRequirement(Game) */
  public missingRequirement(_game: GameLike & { addRequirementToReport?: (msg: string) => void }): boolean {
    return false;
  }
}

/**
 * A single domino tile component.
 * @java game.equipment.component.tile.Domino
 */
export class Domino extends Component {
  /** @java Domino.value — first pip value */
  private readonly _value: number;

  /** @java Domino.value2 — second pip value */
  private readonly _value2: number;

  /**
   * @java game/equipment/component/tile/Domino.java constructor
   *
   * @param name      The name of the domino (e.g. "Domino45").
   * @param role      The owner of the domino.
   * @param value     The first pip value.
   * @param value2    The second pip value.
   * @param generator Optional move generator.
   */
  public constructor(
    name: string,
    role: RoleType,
    value: number,
    value2: number,
    generator: MovesFunction | null = null,
  ) {
    // @java Domino.java:55–61 — super(...) with a fixed walk for large-piece shape
    // The walk is not modelled in the TS port (no StepType enum needed).
    super(name, role, generator, null, null, null);

    this._value  = value;
    this._value2 = value2;

    // @java Domino.java:65 — nameWithoutNumber = StringRoutines.removeTrailingNumbers(name)
    this.nameWithoutNumber = name.replace(/\d+$/, "");

    // @java Domino.java:67 — style = ComponentStyleType.Domino
    this.style = "Domino";
  }

  /** @java Domino.clone() */
  public clone(): Domino {
    return new Domino(
      this.name() ?? "",
      this.role(),
      this._value,
      this._value2,
      this._generator,
    );
  }

  /** @java Domino.getValue() — first pip value */
  public override getValue(): number  { return this._value; }

  /** @java Domino.getValue2() — second pip value */
  public override getValue2(): number { return this._value2; }

  /**
   * @java Domino.isDoubleDomino()
   * @returns true if both pip values are equal.
   */
  public override isDoubleDomino(): boolean {
    // @java Domino.java:108 — return getValue() == getValue2()
    return this._value === this._value2;
  }

  /** @java Domino.isDomino() */
  public override isDomino(): boolean { return true; }

  /** @java Domino.numSides() — 4 sides (rectangular domino) */
  public override numSides(): number { return 4; }

  /** @java Domino.isTile() */
  public override isTile(): boolean { return true; }

  /**
   * @java Domino.missingRequirement(Game)
   * Reports a missing-requirement error if the owner role is invalid.
   */
  public override missingRequirement(
    game: GameLike & { addRequirementToReport?: (msg: string) => void; players(): { count(): number } },
  ): boolean {
    let missingRequirement = false;
    const role = this.role();
    if (role !== null) {
      const numericRoles: Record<string, number> = {
        P1: 1, P2: 2, P3: 3, P4: 4, P5: 5, P6: 6, P7: 7, P8: 8, Neutral: 0,
      };
      const indexOwnerPhase = numericRoles[role as string] ?? -1;
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
          "A domino is defined in the equipment with an incorrect owner: " + role + ".",
        );
        missingRequirement = true;
      }
    }
    return missingRequirement;
  }

  /**
   * @java Domino.toEnglish(Game)
   * @returns Human-readable English description of this domino.
   */
  public toEnglish(): string {
    const nameWithoutNum = this.nameWithoutNumber;
    // @java Domino.java:190–196 — StringRoutines.getPlural
    const plural = nameWithoutNum.endsWith("s") ? "es" : "s";
    return nameWithoutNum + plural + ", with values " + this._value + " and " + this._value2;
  }
}

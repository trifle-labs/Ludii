// @java Core/src/game/equipment/component/tile/Tile.java

/**
 * Defines a tile, a component following the tiling with internal connection.
 *
 * @java game/equipment/component/tile/Tile.java
 * @author Eric.Piette
 */

import { Component } from "../Component.js";
import type { RoleType, GameLike } from "../../Item.js";
import type { MovesFunction } from "../../../../base.js";
import type { StepType } from "../../../types/board/StepType.js";
import type { Path } from "./Path.js";

/** Java Constants.OFF = -1 */
const OFF = -1;

/** Java Constants.MAX_SIDES_TILE = 8 */
const MAX_SIDES_TILE = 8;

/**
 * Mirrors Java's game.util.moves.Flips.
 * @java game/util/moves/Flips.java
 */
export interface Flips {
  /** @java Flips.flipA() */
  flipA(): number;
  /** @java Flips.flipB() */
  flipB(): number;
}

/**
 * Defines a tile component.
 *
 * @java game/equipment/component/tile/Tile.java
 */
export class Tile extends Component {
  /** @java Tile.terminus — The terminus. */
  private _terminus: number[] | null;

  /** @java Tile.numTerminus — The number of terminus, if this is the same for each side. */
  private readonly _numTerminus: number | null;

  /** @java Tile.paths — The paths. */
  private readonly _paths: Path[] | null;

  /** @java Tile.numSides — The number of sides of the tile. */
  private _numSides: number;

  /** @java Tile.flips — The flips value of a piece. */
  private readonly _flips: Flips | null;

  /**
   * @java Tile(String, RoleType, StepType[], StepType[][], Integer, Integer[], Integer, Path[], Flips, Moves, Integer, Integer, Integer)
   *
   * @param name         The name of the tile.
   * @param role         The owner of the tile.
   * @param walk         A turtle graphics walk to define the shape of a large tile.
   * @param walks        Many turtle graphics walks to define the shape of a large tile.
   * @param numSides     The number of sides of the tile.
   * @param slots        The number of slots for each side.
   * @param slotsPerSide The number of slots for each side if this is the same number for each side [1].
   * @param paths        The connection in the tile.
   * @param flips        The corresponding values to flip.
   * @param generator    The associated moves of this component.
   * @param maxState     To set the maximum local state the game should check.
   * @param maxCount     To set the maximum count the game should check.
   * @param maxValue     To set the maximum value the game should check.
   */
  public constructor(
    name: string,
    role: RoleType | null,
    walk: StepType[] | null,
    walks: StepType[][] | null,
    numSides: number | null,
    slots: number[] | null,
    slotsPerSide: number | null,
    paths: Path[] | null,
    flips: Flips | null,
    generator: MovesFunction | null = null,
    maxState: number | null = null,
    maxCount: number | null = null,
    maxValue: number | null = null,
  ) {
    // @java Tile.java:86–93
    super(
      name,
      (role === null) ? "Shared" : role,
      (walk !== null) ? [walk] : walks,
      null,
      generator,
      maxState,
      maxCount,
      maxValue,
    );

    // @java Tile.java:95–101 — Limit on the max number of sides.
    if (numSides !== null) {
      if (numSides < 0 || numSides > MAX_SIDES_TILE) {
        throw new Error(
          "The number of sides of a tile piece can not be negative or to exceed " + MAX_SIDES_TILE + ".",
        );
      }
    }

    // @java Tile.java:103–109 — validate walk/walks
    let numNonNull = 0;
    if (walk !== null) numNonNull++;
    if (walks !== null) numNonNull++;
    if (numNonNull > 1) {
      throw new Error("Only one of 'walk' and 'walks' can be specified.");
    }

    // @java Tile.java:111–118 — validate slots/slotsPerSide
    numNonNull = 0;
    if (slots !== null) numNonNull++;
    if (slotsPerSide !== null) numNonNull++;
    if (numNonNull > 1) {
      throw new Error("Zero or one Or parameter can be non-null.");
    }

    // @java Tile.java:120–129 — slots → terminus
    if (slots !== null) {
      this._terminus = new Array<number>(slots.length);
      for (let i = 0; i < this._terminus.length; i++) {
        this._terminus[i] = slots[i] ?? 0;
      }
    } else {
      this._terminus = null;
    }

    // @java Tile.java:132 — numTerminus = (slots == null && slotsPerSide == null) ? 1 : slotsPerSide
    this._numTerminus = (slots === null && slotsPerSide === null) ? 1 : slotsPerSide;
    this._paths       = paths;
    // @java Tile.java:134 — nameWithoutNumber = StringRoutines.removeTrailingNumbers(name)
    this.nameWithoutNumber = name.replace(/\d+$/, "");

    // @java Tile.java:136–139 — style depends on walk
    if (this.walk() !== null) {
      this._style = "LargePiece";
    } else {
      this._style = "Tile";
    }

    // @java Tile.java:141
    this._numSides = (numSides !== null) ? numSides : OFF;
    this._flips    = flips;
  }

  /** @java Tile.isTile() */
  public override isTile(): boolean { return true; }

  /** @java Tile.terminus() */
  public override terminus(): number[] | null { return this._terminus; }

  /** @java Tile.numTerminus() */
  public override numTerminus(): number {
    // @java Tile.java — numTerminus is Integer, can be null; we return OFF if null
    return this._numTerminus !== null ? this._numTerminus : OFF;
  }

  /** @java Tile.paths() */
  public override paths(): Path[] | null { return this._paths; }

  /** @java Tile.numSides() */
  public override numSides(): number { return this._numSides; }

  /** @java Tile.setNumSides(int) */
  public override setNumSides(numSides: number): void {
    this._numSides = numSides;
  }

  /** @java Tile.getFlips() */
  public override getFlips(): Flips | null { return this._flips; }

  /**
   * @java Tile.missingRequirement(Game)
   */
  public override missingRequirement(
    game: GameLike & { addRequirementToReport?: (msg: string) => void; players(): { count(): number } },
  ): boolean {
    // @java Tile.java:266–290
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
          "A tile is defined in the equipment with an incorrect owner: " + role + ".",
        );
        missingRequirement = true;
      }
    }
    return missingRequirement;
  }

  /**
   * @java Tile.toEnglish(Game)
   */
  public toEnglish(): string {
    // @java Tile.java:296–325
    let str = this.nameWithoutNumber;
    const plural = str.endsWith("s") ? "es" : "s";
    str += plural;

    if (this._flips !== null) {
      str += ", (flip " + this._flips.flipA() + " " + this._flips.flipB() + ")";
    }

    let pathString = "";
    if (this._paths !== null && this._paths.length > 0) {
      pathString = " [";
      for (const p of this._paths) {
        pathString += p.toEnglish() + ",";
      }
      pathString = pathString.substring(pathString.length - 1) + "]";
    }

    let terminusString = "";
    if (this._terminus !== null && this._terminus.length > 0) {
      terminusString = " [";
      for (const t of this._terminus) {
        terminusString += t + ",";
      }
      terminusString = terminusString.substring(terminusString.length - 1) + "]";
    }

    str += ", with " + this._numSides + " sides and " + this._numTerminus + " terminus" + pathString + terminusString;

    return str;
  }

  /** @java Tile.clone() */
  public clone(): Tile {
    // @java Tile.java:156–185 — copy constructor
    const t = new Tile(
      this.name() ?? "",
      this.role(),
      null,
      this.walk(),
      this._numSides !== OFF ? this._numSides : null,
      this._terminus !== null ? [...this._terminus] : null,
      this._numTerminus !== 1 ? this._numTerminus : null,
      this._paths !== null ? [...this._paths] : null,
      this._flips,
      this._generator,
      this.maxState !== OFF ? this.maxState : null,
      this.maxCount !== OFF ? this.maxCount : null,
      this.maxValue !== OFF ? this.maxValue : null,
    );
    return t;
  }
}

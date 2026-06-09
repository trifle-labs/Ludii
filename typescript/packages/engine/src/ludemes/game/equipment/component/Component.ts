// @java Core/src/game/equipment/component/Component.java

/**
 * Defines a component (piece on the board).
 *
 * @java game/equipment/component/Component.java
 * @author cambolbro and Eric.Piette
 */

import { Item, type RoleType, type GameLike } from "../Item.js";
import type { MovesFunction } from "../../../base.js";
import type { DirectionFacing } from "../../util/directions/DirectionFacing.js";
import type { StepType } from "../../types/board/StepType.js";

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/** Java Constants.OFF = -1 */
const OFF = -1;

/**
 * Mirrors Java's metadata.graphics.util.ComponentStyleType.
 * @java metadata.graphics.util.ComponentStyleType
 */
export type ComponentStyleType =
  | "Piece" | "Card" | "Die" | "Domino" | "Tile" | "LargePiece" | "Hand";

/**
 * Defines a component.
 *
 * @java game/equipment/component/Component.java
 */
export class Component extends Item {
  /** @java Component.dirn — Current direction that piece is facing. */
  protected _dirn: DirectionFacing | null;

  /** @java Component.generator — Optional generator which creates moves for this piece on demand */
  protected _generator: MovesFunction | null;

  /** @java Component.potentialMoves — The pre-generation of the moves of the generator in an empty board. */
  protected _potentialMoves: boolean[][] | null;

  /** @java Component.walk — In case of large Piece, the walk to describe the shape of the piece. */
  protected readonly _walk: StepType[][] | null;

  /** @java Component.nameWithoutNumber — Use to keep the label without the role of the player for graphics. */
  public nameWithoutNumber: string;

  /** @java Component.style — The style of the component. */
  protected _style: ComponentStyleType;

  /** @java Component.bias — Bias values for dice, cards, etc. */
  protected _bias: number[] | null;

  /** @java Component.maxState — The maximum local state the game should check. */
  public readonly maxState: number;

  /** @java Component.maxCount — The maximum count the game should check. */
  public readonly maxCount: number;

  /** @java Component.maxValue — The maximum value the game should check. */
  public readonly maxValue: number;

  /**
   * @java Component(String, RoleType, StepType[][], DirectionFacing, Moves, Integer, Integer, Integer)
   *
   * @param label     The name of the component.
   * @param role      The owner of the component.
   * @param walk      The walk used to generate a large piece.
   * @param dirn      The direction where face the component.
   * @param generator The moves associated with the component.
   * @param maxState  To set the maximum local state the game should check.
   * @param maxCount  To set the maximum count the game should check.
   * @param maxValue  To set the maximum value the game should check.
   */
  public constructor(
    label: string | null,
    role: RoleType,
    walk: StepType[][] | null,
    dirn: DirectionFacing | null,
    generator: MovesFunction | null,
    maxState: number | null,
    maxCount: number | null,
    maxValue: number | null,
  ) {
    // @java Component.java:92 — super(label, Constants.UNDEFINED, role);
    super(label, UNDEFINED, role);

    // @java Component.java:94-100
    this._walk      = walk;
    this._dirn      = dirn !== null ? dirn : null;
    this._generator = generator;
    this.setType("Component");
    this.maxState = maxState !== null ? maxState : OFF;
    this.maxCount = maxCount !== null ? maxCount : OFF;
    this.maxValue = maxValue !== null ? maxValue : OFF;

    this.nameWithoutNumber = (label ?? "").replace(/\d+$/, "");
    this._style            = "Piece";
    this._potentialMoves   = null;
    this._bias             = null;
  }

  /**
   * @java Component.getDirn()
   * @returns direction.
   */
  public getDirn(): DirectionFacing | null {
    return this._dirn;
  }

  /**
   * @java Component.getValue()
   * @returns The first value (for dominoes).
   */
  public getValue(): number {
    return UNDEFINED;
  }

  /**
   * @java Component.getFlips()
   * @returns The flips values.
   */
  public getFlips(): unknown {
    return null;
  }

  /**
   * @java Component.generator()
   * @returns Optional generator of moves for pieces.
   */
  public generator(): MovesFunction | null {
    return this._generator;
  }

  /**
   * @java Component.maxState()
   * @returns The maximum local state for that component.
   */
  public maxStateVal(): number {
    return this.maxState;
  }

  /**
   * @java Component.maxCount()
   * @returns The maximum count for that component.
   */
  public maxCountVal(): number {
    return this.maxCount;
  }

  /**
   * @java Component.maxValue()
   * @returns The maximum value for that component.
   */
  public maxValueVal(): number {
    return this.maxValue;
  }

  /**
   * @java Component.generate(Context)
   * @returns List of moves, possibly empty.
   */
  public generate(context: unknown): unknown[] {
    if (this._generator !== null) {
      return (this._generator as unknown as { eval(ctx: unknown): unknown[] }).eval(context);
    }
    return [];
  }

  /**
   * @java Component.equals(Object)
   */
  public equals(o: unknown): boolean {
    if (!(o instanceof Component)) return false;
    const comp = o as Component;
    return this.name() === comp.name();
  }

  /**
   * @java Component.clone() — copy this component (used by Equipment.createItems to
   * clone an `Each` component once per player). A prototype-preserving shallow copy
   * reproduces Java's copy constructor for the equipment-build use (role/name/index
   * are then overwritten on the copy by createItems).
   */
  public clone(): Component {
    return Object.assign(Object.create(Object.getPrototypeOf(this) as object), this) as Component;
  }

  /**
   * @java Object.getClass() — minimal stand-in. Equipment.createItems reads
   * getClass().toString() only to derive a default name when name() is null.
   */
  public getClass(): { toString(): string } {
    const cn = this.constructor.name;
    return { toString: () => `class game.equipment.component.${cn}` };
  }

  /**
   * @java Component.setDirection(DirectionFacing)
   * Set the direction of the piece.
   */
  public setDirection(direction: DirectionFacing): void {
    this._dirn = direction;
  }

  /**
   * @java Component.setMoves(Moves)
   * To clone the generator.
   */
  public setMoves(generator: MovesFunction): void {
    this._generator = generator;
  }

  /**
   * @java Component.isLargePiece()
   * @returns True if this is a large piece.
   */
  public isLargePiece(): boolean {
    return this._walk !== null;
  }

  /**
   * @java Component.walk()
   * @returns The walk in case of large piece.
   */
  public walk(): StepType[][] | null {
    return this._walk;
  }

  /**
   * @java Component.getBias()
   * @returns The biased values of a die.
   */
  public getBias(): number[] | null {
    return this._bias;
  }

  /**
   * @java Component.setBiased(Integer[])
   * To set the biased values of a die.
   */
  public setBiased(biased: number[] | null): void {
    if (biased !== null) {
      this._bias = [...biased];
    }
  }

  /**
   * @java Component.possibleMove(int, int)
   * @returns True if a move is potentially legal.
   */
  public possibleMove(from: number, to: number): boolean {
    if (this._potentialMoves === null) return false;
    const row = this._potentialMoves[from];
    if (row === undefined) return false;
    return row[to] === true;
  }

  /**
   * @java Component.possibleMoves()
   * @returns Full matrix of all potential moves for this component type.
   */
  public possibleMoves(): boolean[][] | null {
    return this._potentialMoves;
  }

  /**
   * @java Component.setPossibleMove(boolean[][])
   * To set the possible moves.
   */
  public setPossibleMove(possibleMoves: boolean[][]): void {
    this._potentialMoves = possibleMoves;
  }

  // --------------- DIE --------------------------------------------------

  /** @java Component.isDie() */
  public isDie(): boolean { return false; }

  /** @java Component.getFaces() */
  public getFaces(): number[] { return []; }

  /** @java Component.getNumFaces() */
  public getNumFaces(): number { return UNDEFINED; }

  /** @java Component.roll(Context) */
  public roll(_context: unknown): number { return OFF; }

  /** @java Component.setFaces(Integer[], Integer) */
  public setFaces(_faces: number[] | null, _start: number | null): void {
    // Nothing to do.
  }

  // --------------- CARD -------------------------------------------------

  /** @java Component.isCard() */
  public isCard(): boolean { return false; }

  /** @java Component.suit() */
  public suit(): number { return OFF; }

  /** @java Component.trumpValue() */
  public trumpValue(): number { return OFF; }

  /** @java Component.rank() */
  public rank(): number { return OFF; }

  /** @java Component.trumpRank() */
  public trumpRank(): number { return OFF; }

  /** @java Component.cardType() */
  public cardType(): unknown { return null; }

  // --------------- TILE -------------------------------------------------

  /** @java Component.isTile() */
  public isTile(): boolean { return false; }

  /** @java Component.terminus() */
  public terminus(): number[] | null { return null; }

  /** @java Component.numTerminus() */
  public numTerminus(): number { return OFF; }

  /** @java Component.numSides() */
  public numSides(): number { return OFF; }

  /** @java Component.setNumSides(int) */
  public setNumSides(_numSides: number): void {
    // Nothing to do.
  }

  /** @java Component.paths() */
  public paths(): unknown[] | null { return null; }

  /** @java Component.style() */
  public styleType(): ComponentStyleType { return this._style; }

  // --------------- DOMINO -----------------------------------------------

  /** @java Component.isDoubleDomino() */
  public isDoubleDomino(): boolean { return false; }

  /** @java Component.getValue2() */
  public getValue2(): number { return OFF; }

  /** @java Component.isDomino() */
  public isDomino(): boolean { return false; }

  /** @java Component.getNameWithoutNumber() */
  public getNameWithoutNumber(): string {
    return this.nameWithoutNumber;
  }

  /** @java Component.setNameWithoutNumber(String) */
  public setNameWithoutNumber(name: string): void {
    this.nameWithoutNumber = name;
  }

  /** @java Component.style() */
  public style(): ComponentStyleType { return this._style; }

  /** @java Component.setStyle(ComponentStyleType) */
  public setStyle(st: ComponentStyleType): void {
    this._style = st;
  }

  /**
   * @java Component.credit()
   * Returns credit details for images, or null if unknown.
   */
  public override credit(): string | null {
    const n = this.nameWithoutNumber ?? "";

    // --- svg/animals ---
    if (n.toLowerCase() === "bear") return n + " image by Freepik from http://www.flaticon.com.";
    if (n.toLowerCase() === "seal") return n + " image by Freepik from http://www.flaticon.com.";
    if (n.toLowerCase() === "camel") return n + " image from https://www.pngrepo.com/svg/297513/camel.";
    if (n.toLowerCase() === "cat") return n + " image from http://getdrawings.com/cat-head-icon#cat-head-icon-8.png.";
    if (n.toLowerCase() === "chicken") return n + " image by Stila from https://favpng.com/png_view/.";
    if (n.toLowerCase() === "cow") return n + " image from https://www.nicepng.com/ourpic/u2w7o0t4e6y3a9u2_animals-chinese-new-year-icon/.";
    if (n.toLowerCase() === "dog") return n + " image from https://favpng.com/png_view/albatross-gray-wolf-clip-art-png/R6VmvfkC.";
    if (n.toLowerCase() === "crab") return n + " image by Freepik from http://www.flaticon.com.";
    if (n.toLowerCase() === "dove") return n + " image from https://www.pngwing.com/en/free-png-xxwye.";
    if (n.toLowerCase() === "dragon") return n + " image from https://ya-webdesign.com/imgdownload.html";
    if (n.toLowerCase() === "duck") return n + " image from https://ya-webdesign.com/imgdownload.html";
    if (n.toLowerCase() === "eagle") return n + " image from https://www.pngbarn.com/png-image-tgmlh.";
    if (n.toLowerCase() === "elephant") return n + " image from http://getdrawings.com/get-icon#elephant-icon-app-2.png.";
    if (n.toLowerCase() === "fish") return n + " image from https://www.svgrepo.com/svg/109765/fish.";
    if (n.toLowerCase() === "chick") return n + " image from https://www.svgrepo.com/svg/123529/bird.";
    if (n.toLowerCase() === "hyena") return n + " image from https://www.svgrepo.com/svg/1841/hyena-head.";
    if (n.toLowerCase() === "fox") return n + " image from https://www.svgrepo.com/svg/40267/fox.";
    if (n.toLowerCase() === "goat") return n + " image from https://ya-webdesign.com/imgdownload.html.";
    if (n.toLowerCase() === "goose") return n + " image from https://depositphotos.com/129413072/stock-illustration-web-goose-icon.html.";
    if (n.toLowerCase() === "hare") return n + " image by Freepik from https://www.flaticon.com/free-icon/.";
    if (n.toLowerCase() === "horse") return n + " image from https://commons.wikimedia.org/wiki/File:Chess_tile_nl.svg.";
    if (n.toLowerCase() === "jaguar") return n + " image from https://icons8.com/icons/set/jaguar.";
    if (n.toLowerCase() === "lamb") return n + " image from https://ya-webdesign.com/imgdownload.html.";
    if (n.toLowerCase() === "leopard") return n + " image from https://www.svgrepo.com/svg/297517/leopard.";
    if (n.toLowerCase() === "lion") return n + " image by Freepik from https://www.flaticon.com/free-icon/.";
    if (n.toLowerCase() === "lioness") return n + " image by Freepik from https://www.flaticon.com/free-icon/.";
    if (n.toLowerCase() === "monkey") return n + " image from https://www.pngbarn.com/png-image-eonln.";
    if (n.toLowerCase() === "mountainlion") return n + " image by Tae S Yang from https://icon-icons.com/nl/pictogram/puma-dier/123525.";
    if (n.toLowerCase() === "mouse") return n + " image by Freepik from https://www.flaticon.com/free-icon/mouse_235093.";
    if (n.toLowerCase() === "ox") return n + " image from https://www.svgrepo.com/svg/19280/cattle-skull.";
    if (n.toLowerCase() === "panther") return n + " image by Freepik from https://www.flaticon.com/free-icon/cat-face-outline_57104.";
    if (n.toLowerCase() === "penguin") return n + " image from https://ya-webdesign.com/imgdownload.html.";
    if (n.toLowerCase() === "prawn") return n + " image by Freepik from https://www.flaticon.com/free-icon/prawn_202274.";
    if (n.toLowerCase() === "puma") return n + " image by Tae S Yang from https://icon-icons.com/nl/pictogram/puma-dier/123525.";
    if (n.toLowerCase() === "rabbit") return n + " image from https://ya-webdesign.com/imgdownload.html.";
    if (n.toLowerCase() === "rat") return n + " image from https://webstockreview.net/image/clipart-rat-head-cartoon/642646.html.";
    if (n.toLowerCase() === "rhino") return n + " image by Freepik from https://www.flaticon.com/free-icon/.";
    if (n.toLowerCase() === "sheep") return n + " image from https://www.pngwing.com/en/free-png-nirzv.";
    if (n.toLowerCase() === "snake") return n + " image by Freepik from https://www.flaticon.com/free-icon/.";
    if (n.toLowerCase() === "tiger") return n + " image from https://www.pngwing.com/en/free-png-hbgdy.";
    if (n.toLowerCase() === "wolf") return n + " image by Freepik from https://www.flaticon.com.";

    // --- svg/chess ---
    if (
      n.toLowerCase() === "bishop" ||
      n.toLowerCase() === "king" ||
      n.toLowerCase() === "knight" ||
      n.toLowerCase() === "pawn" ||
      n.toLowerCase() === "queen" ||
      n.toLowerCase() === "rook"
    ) return n + " images from the Casefont, Arial Unicode MS, PragmataPro and Symbola TTF fonts.";

    // --- svg/misc ---
    if (n.toLowerCase() === "disc") return n + " image from svgrepo.com.";
    if (n.toLowerCase() === "dot") return n + " image from svgrepo.com.";
    if (n.toLowerCase() === "star") return n + " image from svgrepo.com.";
    if (n.toLowerCase() === "cross") return n + " image from svgrepo.com.";
    if (n.toLowerCase() === "hex") return n + " image from svgrepo.com.";
    if (n.toLowerCase() === "square") return n + " image from svgrepo.com.";
    if (n.toLowerCase() === "triangle") return n + " image from svgrepo.com.";

    return null;
  }

  /**
   * @java Component.maxStepsForward()
   * @returns The maximum number of forward steps for a walk of this piece.
   */
  public maxStepsForward(): number {
    if (this._walk === null) return 0;
    let maxStepsForward = 0;
    for (let i = 0; i < this._walk.length; i++) {
      const row = this._walk[i];
      if (row === undefined) continue;
      let stepsForward = 0;
      for (let j = 0; j < row.length; j++) {
        if (row[j] === "F") {
          stepsForward++;
        }
      }
      if (stepsForward > maxStepsForward) {
        maxStepsForward = stepsForward;
      }
    }
    return maxStepsForward;
  }

  /**
   * @java Component.missingRequirement(Game)
   */
  public missingRequirement(
    _game: GameLike & { addRequirementToReport?: (msg: string) => void },
  ): boolean {
    return false;
  }

  /**
   * @java Component.willCrash(Game)
   */
  public willCrash(_game: unknown): boolean {
    return false;
  }
}

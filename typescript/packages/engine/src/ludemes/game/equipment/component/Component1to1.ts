/**
 * @java game/equipment/component/Component.java Component
 *
 * Abstract base for all component types (Piece, Card, Die, Domino, Tile).
 * Holds: name, owner, 1-based component index, optional move generator, and
 * component-type helpers mirroring Java's isCard/isDie/isDomino/isTile guards.
 *
 * Note: this intentionally does NOT extend Item1to1 — in the 1:1 data-path the
 * Component is used standalone (Equipment1to1 already wraps Piece which has an
 * analogous interface). This class extends Piece-like fields for Card/Die/Domino.
 *
 * @java game/equipment/component/Component.java — name/owner/index/generator
 */

import type { MovesFunction } from "../../../base.js";

/** Mirrors Java's metadata.graphics.util.ComponentStyleType */
export type ComponentStyleType =
  | "Piece"
  | "Card"
  | "Die"
  | "Domino"
  | "Tile"
  | "LargePiece"
  | "Hand";

export abstract class Component1to1 {
  /** @java Component.nameWithoutNumber (kept as public for graphics helpers) */
  public nameWithoutNumber: string;

  /** The piece name including owner suffix, e.g. "King1". @java Component (via Item) */
  public readonly name: string;

  /** 1-based owner player id.  0 = Neutral/Shared. @java Component.owner() via Item */
  public readonly owner: number;

  /**
   * 1-based component index assigned by Equipment.
   * @java Component.index set by Equipment.create
   */
  public index: number;

  /**
   * Optional move generator for this component.
   * @java Component.generator()
   */
  public generator: MovesFunction | null;

  /** @java Component.maxState */
  public readonly maxState: number;
  /** @java Component.maxCount */
  public readonly maxCount: number;
  /** @java Component.maxValue */
  public readonly maxValue: number;

  /** @java Component.style */
  protected style: ComponentStyleType;

  /** OFF sentinel — mirrors Java Constants.OFF = -1 */
  protected static readonly OFF = -1;

  /**
   * @java game/equipment/component/Component.java constructor
   *
   * @param name      Piece label including owner suffix (e.g. "King1").
   * @param owner     1-based player owner (0 = Neutral/Shared).
   * @param maxState  Maximum local state (-1 = unused).
   * @param maxCount  Maximum count (-1 = unused).
   * @param maxValue  Maximum value (-1 = unused).
   * @param generator Optional move generator.
   */
  protected constructor(
    name: string,
    owner: number,
    maxState = Component1to1.OFF,
    maxCount = Component1to1.OFF,
    maxValue = Component1to1.OFF,
    generator: MovesFunction | null = null,
  ) {
    this.name             = name;
    this.owner            = owner;
    this.index            = 0;
    this.generator        = generator;
    this.maxState         = maxState;
    this.maxCount         = maxCount;
    this.maxValue         = maxValue;
    this.nameWithoutNumber = name.replace(/\d+$/, "");
    this.style            = "Piece";
  }

  /** @java Component.isDie() */
  public isDie(): boolean   { return false; }
  /** @java Component.isCard() */
  public isCard(): boolean  { return false; }
  /** @java Component.isDomino() */
  public isDomino(): boolean { return false; }
  /** @java Component.isTile() */
  public isTile(): boolean  { return false; }

  /** @java Component.getValue() — first value (overridden by Domino/Die) */
  public getValue(): number { return Component1to1.OFF; }
  /** @java Component.getValue2() — second value (overridden by Domino) */
  public getValue2(): number { return Component1to1.OFF; }
  /** @java Component.suit() — card suit (overridden by Card) */
  public suit(): number     { return Component1to1.OFF; }
  /** @java Component.rank() — card rank (overridden by Card) */
  public rank(): number     { return Component1to1.OFF; }
  /** @java Component.trumpValue() */
  public trumpValue(): number { return Component1to1.OFF; }
  /** @java Component.trumpRank() */
  public trumpRank(): number  { return Component1to1.OFF; }
  /** @java Component.getNumFaces() — die faces count */
  public getNumFaces(): number { return Component1to1.OFF; }
  /** @java Component.getFaces() — die face values */
  public getFaces(): number[] { return []; }
  /** @java Component.numSides() — tile side count */
  public numSides(): number   { return Component1to1.OFF; }
  /** @java Component.isDoubleDomino() */
  public isDoubleDomino(): boolean { return false; }
  /** @java Component.style() */
  public styleType(): ComponentStyleType { return this.style; }
}

/**
 * @java game/equipment/component/tile/Tile.java Tile
 *
 * A tile component with internal connection paths, slot terminus counts, and
 * flip symmetry metadata. Extends Component1to1.
 *
 * @java game/equipment/component/tile/Tile.java — constructor/isTile/terminus/paths/numSides/flips
 */

import { Component1to1 } from "../Component1to1.js";
import type { Path1to1 } from "./Path1to1.js";
import type { MovesFunction } from "../../../../base.js";

/** Mirrors Java's game.util.moves.Flips (flipA ↔ flipB face-swap). */
export interface Flips {
  /** @java Flips.flipA() */
  readonly flipA: number;
  /** @java Flips.flipB() */
  readonly flipB: number;
}

/** Java Constants.OFF = -1 */
const OFF = -1;
/** Java Constants.MAX_SIDES_TILE = 8 (used in validation, not enforced here) */
// const MAX_SIDES_TILE = 8;

export class Tile1to1 extends Component1to1 {
  /** @java Tile.terminus — per-side terminus slot counts */
  private _terminus: number[] | null;

  /**
   * @java Tile.numTerminus — uniform terminus count if all sides equal (null = use per-side).
   * Java default: 1 when no explicit slots provided.
   */
  public readonly numTerminus: number | null;

  /** @java Tile.paths — internal connections */
  private readonly _paths: readonly Path1to1[] | null;

  /** @java Tile.numSides */
  private _numSides: number;

  /** @java Tile.flips */
  public readonly flips: Flips | null;

  /**
   * @java game/equipment/component/tile/Tile.java constructor (simplified)
   *
   * @param name        Tile name (e.g. "TileX").
   * @param owner       1-based player owner (0 = Shared).
   * @param numSides    Number of sides (OFF if unset).
   * @param slots       Per-side terminus slot counts (null if uniform or absent).
   * @param slotsPerSide Uniform slot count for all sides (null if absent).
   * @param paths       Internal path connections (null if absent).
   * @param flips       Flip symmetry definition (null if absent).
   * @param generator   Optional move generator.
   * @param maxState    Max local state.
   * @param maxCount    Max count.
   * @param maxValue    Max value.
   */
  public constructor(
    name: string,
    owner: number,
    numSides: number | null,
    slots: number[] | null,
    slotsPerSide: number | null,
    paths: readonly Path1to1[] | null,
    flips: Flips | null,
    generator: MovesFunction | null = null,
    maxState: number | null = null,
    maxCount: number | null = null,
    maxValue: number | null = null,
  ) {
    super(
      name,
      owner,
      maxState ?? OFF,
      maxCount ?? OFF,
      maxValue ?? OFF,
      generator,
    );

    // @java Tile.java:122–130 — slots → terminus
    if (slots !== null) {
      this._terminus = [...slots];
    } else {
      this._terminus = null;
    }

    // @java Tile.java:132 — numTerminus
    // (slots == null && slotsPerSide == null) ? 1 : slotsPerSide
    this.numTerminus = (slots === null && slotsPerSide === null) ? 1 : slotsPerSide;

    this._paths    = paths;
    this._numSides = (numSides !== null) ? numSides : OFF;
    this.flips     = flips;

    // @java Tile.java:134 — nameWithoutNumber = removeTrailingNumbers(name)
    this.nameWithoutNumber = name.replace(/\d+$/, "");

    // @java Tile.java:136–139 — style depends on whether a walk is defined
    // (In the TS port, we don't model walks; default to Tile style.)
    this.style = "Tile";
  }

  /** @java Tile.isTile() */
  public override isTile(): boolean { return true; }

  /** @java Tile.terminus() */
  public terminus(): number[] | null { return this._terminus; }

  /** @java Tile.paths() */
  public paths(): readonly Path1to1[] | null { return this._paths; }

  /** @java Tile.numSides() */
  public override numSides(): number { return this._numSides; }

  /** @java Tile.setNumSides(int) */
  public setNumSides(n: number): void { this._numSides = n; }

  /** @java Tile.getFlips() */
  public getFlips(): Flips | null { return this.flips; }
}

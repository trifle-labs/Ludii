// @java Core/src/game/equipment/component/Piece.java

/**
 * Defines a piece (a component placed on a board).
 *
 * @java game/equipment/component/Piece.java — `public class Piece extends Component`
 * @author cambolbro and Eric.Piette
 *
 * Faithful port of Java's Piece. The class is exported as `Piece` (its Java name);
 * the file is named PieceFaithful.ts only to avoid a path clash with the legacy
 * bespoke equipment piece (game/equipment/component/Piece.ts) during the
 * single-port transition. JAVA_TS_CTORS maps "game.equipment.component.Piece"
 * to THIS class; the faithful Equipment.createItems builds these.
 */

import { Component } from "./Component.js";
import type { RoleType } from "../Item.js";
import type { MovesFunction } from "../../../base.js";
import type { DirectionFacing } from "../../util/directions/DirectionFacing.js";

/**
 * The flips value of a piece (for flip pieces like Reversi discs).
 * @java game/equipment/component/Flips.java
 */
export interface Flips {
  /** @java Flips.flipA() */
  flipA(): number;
  /** @java Flips.flipB() */
  flipB(): number;
}

/**
 * A game piece.
 *
 * @java game/equipment/component/Piece.java
 */
export class Piece extends Component {
  /** @java Piece.flips — the flips value of a piece. */
  private readonly _flips: Flips | null;

  /**
   * @java Piece(String, RoleType, DirectionFacing, Flips, Moves, Integer, Integer, Integer)
   *
   * @param name      The name of the piece.
   * @param role      The owner of the piece [Each].
   * @param dirn      The direction of the piece.
   * @param flips     The corresponding values to flip.
   * @param generator The moves associated with the piece.
   * @param maxState  Maximum local state the game should check.
   * @param maxCount  Maximum count the game should check.
   * @param maxValue  Maximum value the game should check.
   *
   * @example (piece "Pawn" Each)
   */
  public constructor(
    name: string,
    role: RoleType | null = null,
    dirn: DirectionFacing | null = null,
    flips: Flips | null = null,
    generator: MovesFunction | null = null,
    maxState: number | null = null,
    maxCount: number | null = null,
    maxValue: number | null = null,
  ) {
    // @java Piece.java:62 — super(name, role == null ? Each : role, null, dirn, generator, maxState, maxCount, maxValue)
    super(name, (role === null ? "Each" : role), null, dirn, generator, maxState, maxCount, maxValue);

    // @java Piece.java:65 — strip trailing numbers for the image label (e.g. Tower of Hanoi).
    this.nameWithoutNumber = (name ?? "").replace(/\d+$/, "");
    this._flips = flips;
  }

  /** @java Piece.getFlips() */
  public override getFlips(): Flips | null {
    return this._flips;
  }
}

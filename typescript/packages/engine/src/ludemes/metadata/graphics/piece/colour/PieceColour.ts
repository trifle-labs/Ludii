/**
 * PieceColour.ts
 *
 * @java metadata/graphics/piece/colour/PieceColour.java
 *
 * Sets the colour of a piece.
 * @author Matthew.Stephenson
 */

import type { RoleTypeFull } from "../../../../game/types/play/RoleType.js";
import type { Colour } from "../../util/colour/Colour.js";
import type { GraphicsItem } from "../../GraphicsItem.js";

/**
 * @java metadata/graphics/piece/colour/PieceColour.java — class PieceColour implements GraphicsItem
 */
export class PieceColour implements GraphicsItem {
  /** RoleType condition. */
  private readonly _roleType: RoleTypeFull | null;

  /** Piece name condition. */
  private readonly _pieceName: string | null;

  /** Container index condition. */
  private readonly _container: number | null;

  /** State condition. */
  private readonly _state: number | null;

  /** Value condition. */
  private readonly _value: number | null;

  /** Component fill colour to apply. */
  private readonly _fillColour: Colour | null;

  /** Component stroke colour to apply. */
  private readonly _strokeColour: Colour | null;

  /** Component secondary colour to apply. */
  private readonly _secondaryColour: Colour | null;

  /**
   * @param roleType        Player whose index is to be matched.
   * @param pieceName       Base piece name to match.
   * @param container       Container index to match.
   * @param state           State to match.
   * @param value           Value to match.
   * @param fillColour      Fill colour for this piece.
   * @param strokeColour    Stroke colour for this piece.
   * @param secondaryColour Secondary colour for this piece.
   * @java PieceColour(RoleType, String, Integer, Integer, Integer, Colour, Colour, Colour)
   */
  constructor(
    roleType: RoleTypeFull | null,
    pieceName: string | null,
    container: number | null,
    state: number | null,
    value: number | null,
    fillColour: Colour | null,
    strokeColour: Colour | null,
    secondaryColour: Colour | null,
  ) {
    this._roleType = roleType;
    this._pieceName = pieceName;
    this._container = container;
    this._state = state;
    this._value = value;
    this._fillColour = fillColour;
    this._strokeColour = strokeColour;
    this._secondaryColour = secondaryColour;
  }

  /** @return RoleType condition to check. */
  roleType(): RoleTypeFull | null {
    return this._roleType;
  }

  /** @return Container index condition to check. */
  container(): number | null {
    return this._container;
  }

  /** @return Piece name condition to check. */
  pieceName(): string | null {
    return this._pieceName;
  }

  /** @return Piece state condition to check. */
  state(): number | null {
    return this._state;
  }

  /** @return Piece value condition to check. */
  value(): number | null {
    return this._value;
  }

  /** @return Fill colour to apply onto component image. */
  fillColour(): Colour | null {
    return this._fillColour;
  }

  /** @return Stroke colour to apply onto component image. */
  strokeColour(): Colour | null {
    return this._strokeColour;
  }

  /** @return Secondary colour to apply onto component image. */
  secondaryColour(): Colour | null {
    return this._secondaryColour;
  }

  /** @java PieceColour.concepts(Game) */
  concepts(_game: unknown): unknown {
    return {};
  }

  /** @java PieceColour.gameFlags(Game) */
  gameFlags(_game: unknown): number {
    return 0;
  }

  /** @java PieceColour.needRedraw() */
  needRedraw(): boolean {
    return false;
  }
}

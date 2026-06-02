/**
 * PieceForeground.ts
 *
 * @java metadata/graphics/piece/ground/PieceForeground.java
 *
 * Draws a specified image in front of a piece.
 * @author Matthew.Stephenson
 */

import type { RoleTypeFull } from "../../../../game/types/play/RoleType.js";
import type { Colour } from "../../util/colour/Colour.js";
import type { GraphicsItem } from "../../GraphicsItem.js";

/**
 * @java metadata/graphics/piece/ground/PieceForeground.java — class PieceForeground implements GraphicsItem
 */
export class PieceForeground implements GraphicsItem {
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

  /** Foreground image to draw. */
  private readonly _image: string | null;

  /** Text to draw. */
  private readonly _text: string | null;

  /** Fill colour of drawn image. */
  private readonly _fillColour: Colour | null;

  /** Edge colour of drawn image. */
  private readonly _edgeColour: Colour | null;

  /** Scale of drawn image. */
  private readonly _scale: number;

  /** Scale of drawn image along x-axis. */
  private readonly _scaleX: number;

  /** Scale of drawn image along y-axis. */
  private readonly _scaleY: number;

  /** Rotation of drawn image. */
  private readonly _rotation: number;

  /** Offset right for drawn image. */
  private readonly _offsetX: number;

  /** Offset down for drawn image. */
  private readonly _offsetY: number;

  /**
   * @param roleType   Player whose index is to be matched.
   * @param pieceName  Base piece name to match.
   * @param container  Container index to match.
   * @param state      State to match.
   * @param value      Value to match.
   * @param image      Name of the foreground image to draw.
   * @param text       Text string to draw.
   * @param fillColour Colour for the inner sections of the image.
   * @param edgeColour Colour for the edges of the image.
   * @param scale      Scale for the drawn image relative to the cell size [1.0].
   * @param scaleX     Scale along x-axis [1.0].
   * @param scaleY     Scale along y-axis [1.0].
   * @param rotation   Rotation of the drawn image [0].
   * @param offsetX    Offset distance percentage to push the image to the right [0].
   * @param offsetY    Offset distance percentage to push the image down [0].
   * @java PieceForeground(RoleType, String, Integer, Integer, Integer, String, String, Colour, Colour, Float, Float, Float, Integer, Float, Float)
   */
  constructor(
    roleType: RoleTypeFull | null,
    pieceName: string | null,
    container: number | null,
    state: number | null,
    value: number | null,
    image: string | null,
    text: string | null,
    fillColour: Colour | null,
    edgeColour: Colour | null,
    scale: number | null,
    scaleX: number | null,
    scaleY: number | null,
    rotation: number | null,
    offsetX: number | null,
    offsetY: number | null,
  ) {
    this._roleType = roleType;
    this._pieceName = pieceName;
    this._container = container;
    this._state = state;
    this._value = value;
    this._image = image;
    this._text = text;
    this._fillColour = fillColour;
    this._edgeColour = edgeColour;
    this._scale = scale == null ? 1.0 : scale;
    this._scaleX = scaleX == null ? 1.0 : scaleX;
    this._scaleY = scaleY == null ? 1.0 : scaleY;
    this._rotation = rotation == null ? 0 : rotation;
    this._offsetX = offsetX == null ? 0 : offsetX;
    this._offsetY = offsetY == null ? 0 : offsetY;
  }

  /** @return RoleType condition to check. */
  roleType(): RoleTypeFull | null {
    return this._roleType;
  }

  /** @return Piece name condition to check. */
  pieceName(): string | null {
    return this._pieceName;
  }

  /** @return Container index condition to check. */
  container(): number | null {
    return this._container;
  }

  /** @return Piece state condition to check. */
  state(): number | null {
    return this._state;
  }

  /** @return Piece value condition to check. */
  value(): number | null {
    return this._value;
  }

  /** @return Foreground image to draw. */
  image(): string | null {
    return this._image;
  }

  /** @return Text to draw. */
  text(): string | null {
    return this._text;
  }

  /** @return Fill colour of drawn image. */
  fillColour(): Colour | null {
    return this._fillColour;
  }

  /** @return Edge colour of drawn image. */
  edgeColour(): Colour | null {
    return this._edgeColour;
  }

  /** @return Scale of drawn image. */
  scale(): number {
    return this._scale;
  }

  /** @return Scale of drawn image along x-axis. */
  scaleX(): number {
    return this._scaleX;
  }

  /** @return Scale of drawn image along y-axis. */
  scaleY(): number {
    return this._scaleY;
  }

  /** @return Rotation of drawn image. */
  rotation(): number {
    return this._rotation;
  }

  /** @return Offset right for drawn image. */
  offsetX(): number {
    return this._offsetX;
  }

  /** @return Offset down for drawn image. */
  offsetY(): number {
    return this._offsetY;
  }

  /** @java PieceForeground.concepts(Game) */
  concepts(_game: unknown): unknown {
    return {};
  }

  /** @java PieceForeground.gameFlags(Game) */
  gameFlags(_game: unknown): number {
    return 0;
  }

  /** @java PieceForeground.needRedraw() */
  needRedraw(): boolean {
    return false;
  }
}

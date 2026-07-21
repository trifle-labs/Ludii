// @java Core/src/metadata/graphics/board/ground/BoardForeground.java BoardForeground
/**
 * Java parity:
 * - Core/src/metadata/graphics/board/ground/BoardForeground.java — faithful data-class port.
 *   Draws a specified image in front of the game board.
 */

import type { Colour } from "../../util/colour/Colour.js";

export class BoardForeground {
  private readonly _image: string | null;
  private readonly _fillColour: Colour | null;
  private readonly _edgeColour: Colour | null;
  private readonly _scale: number;
  private readonly _scaleX: number;
  private readonly _scaleY: number;
  private readonly _rotation: number;
  private readonly _offsetX: number;
  private readonly _offsetY: number;

  /**
   * @param image      Name of the foreground image to draw (null = board outline).
   * @param fillColour Fill colour of drawn image (null = phase 0 colour).
   * @param edgeColour Edge colour of drawn image (null = outer edge colour).
   * @param scale      Scale relative to board size [1.0].
   * @param scaleX     Scale along x-axis [1.0].
   * @param scaleY     Scale along y-axis [1.0].
   * @param rotation   Rotation in degrees [0].
   * @param offsetX    Offset to the right as fraction of board size [0].
   * @param offsetY    Offset downward as fraction of board size [0].
   */
  constructor(
    image: string | null,
    fillColour: Colour | null,
    edgeColour: Colour | null,
    scale: number | null,
    scaleX: number | null,
    scaleY: number | null,
    rotation: number | null,
    offsetX: number | null,
    offsetY: number | null,
  ) {
    this._image = image;
    this._fillColour = fillColour;
    this._edgeColour = edgeColour;
    this._scale = scale == null ? 1.0 : scale;
    this._scaleX = scaleX == null ? 1.0 : scaleX;
    this._scaleY = scaleY == null ? 1.0 : scaleY;
    this._rotation = rotation == null ? 0 : rotation;
    this._offsetX = offsetX == null ? 0 : offsetX;
    this._offsetY = offsetY == null ? 0 : offsetY;
  }

  public image(): string | null { return this._image; }
  public fillColour(): Colour | null { return this._fillColour; }
  public edgeColour(): Colour | null { return this._edgeColour; }
  public scale(): number { return this._scale; }
  public scaleX(): number { return this._scaleX; }
  public scaleY(): number { return this._scaleY; }
  public rotation(): number { return this._rotation; }
  public offsetX(): number { return this._offsetX; }
  public offsetY(): number { return this._offsetY; }

  public needRedraw(): boolean { return false; }
}

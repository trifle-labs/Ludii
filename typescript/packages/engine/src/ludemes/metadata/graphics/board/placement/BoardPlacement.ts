// @java Core/src/metadata/graphics/board/placement/BoardPlacement.java BoardPlacement
/**
 * Java parity:
 * - Core/src/metadata/graphics/board/placement/BoardPlacement.java — faithful data-class port.
 *   Modifies the central placement of the game board.
 */

export class BoardPlacement {
  private readonly _scale: number;
  private readonly _offsetX: number;
  private readonly _offsetY: number;

  /**
   * @param scale   Scale for the board [1.0].
   * @param offsetX Offset to the right as fraction of board size [0].
   * @param offsetY Offset downward as fraction of board size [0].
   */
  constructor(
    scale: number | null,
    offsetX: number | null,
    offsetY: number | null,
  ) {
    this._scale = scale == null ? 1.0 : scale;
    this._offsetX = offsetX == null ? 0 : offsetX;
    this._offsetY = offsetY == null ? 0 : offsetY;
  }

  /** @return Scale of board. */
  public scale(): number { return this._scale; }

  /** @return Offset to the right for the board. */
  public offsetX(): number { return this._offsetX; }

  /** @return Offset downward for the board. */
  public offsetY(): number { return this._offsetY; }

  public needRedraw(): boolean { return false; }
}

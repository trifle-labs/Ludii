// @java Core/src/metadata/graphics/board/curvature/BoardCurvature.java BoardCurvature
/**
 * Java parity:
 * - Core/src/metadata/graphics/board/curvature/BoardCurvature.java — faithful data-class port.
 *   Sets the preferred curve offset for the board.
 */

export class BoardCurvature {
  /** Curve offset (used when drawing curves). */
  private readonly _curveOffset: number;

  /**
   * @param curveOffset Curve offset when drawing curves.
   */
  constructor(curveOffset: number) {
    this._curveOffset = curveOffset;
  }

  /** @return Curve offset when drawing curves. */
  public curveOffset(): number {
    return this._curveOffset;
  }

  public needRedraw(): boolean {
    return false;
  }
}

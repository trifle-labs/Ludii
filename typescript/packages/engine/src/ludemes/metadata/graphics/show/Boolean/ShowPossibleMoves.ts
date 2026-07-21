/**
 * Indicates whether the possible moves are always shown.
 *
 * @java metadata/graphics/show/Boolean/ShowPossibleMoves.java
 */

/**
 * @java metadata/graphics/show/Boolean/ShowPossibleMoves.java — class ShowPossibleMoves implements GraphicsItem
 */
export class ShowPossibleMoves {
  /** If the possible moves are always shown. */
  readonly showPossibleMoves: boolean;

  /**
   * @param showPossibleMoves Whether the possible moves are always shown [true].
   */
  constructor(showPossibleMoves: boolean | null) {
    this.showPossibleMoves = showPossibleMoves === null ? true : showPossibleMoves;
  }

  /** @return If the possible moves are always shown. */
  isShowPossibleMoves(): boolean {
    return this.showPossibleMoves;
  }

  needRedraw(): boolean {
    return false;
  }
}

// @java Core/src/metadata/graphics/no/Boolean/NoBoard.java NoBoard
/**
 * Java parity:
 * - Core/src/metadata/graphics/no/Boolean/NoBoard.java — faithful data-class port.
 *   Indicates whether the board should be hidden.
 *   Useful in card and hand games which have no physical board.
 */

export class NoBoard {
  private readonly _boardHidden: boolean;

  /**
   * @param boardHidden Whether the board should be hidden or not [true].
   */
  constructor(boardHidden?: boolean | null) {
    this._boardHidden = boardHidden == null ? true : boardHidden;
  }

  /** @return If the board should be hidden. */
  public boardHidden(): boolean {
    return this._boardHidden;
  }

  public needRedraw(): boolean {
    return false;
  }
}

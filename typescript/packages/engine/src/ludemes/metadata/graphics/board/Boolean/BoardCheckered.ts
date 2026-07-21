// @java Core/src/metadata/graphics/board/Boolean/BoardCheckered.java BoardCheckered
/**
 * Java parity:
 * - Core/src/metadata/graphics/board/Boolean/BoardCheckered.java — faithful data-class port.
 *   Indicates whether the board should be drawn in a checkered pattern.
 *   Colouring is done based on the board's phases.
 */

export class BoardCheckered {
  /** Whether the board should be checkered. */
  private readonly _checkeredBoard: boolean;

  /**
   * @param checkeredBoard Whether the board should be checkered or not [true].
   */
  constructor(checkeredBoard?: boolean | null) {
    this._checkeredBoard = checkeredBoard == null ? true : checkeredBoard;
  }

  /** @return If the board should be checkered. */
  public checkeredBoard(): boolean {
    return this._checkeredBoard;
  }

  public needRedraw(): boolean {
    return false;
  }
}

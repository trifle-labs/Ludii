/**
 * Indicates whether the pits on the board should be marked with their owner.
 *
 * @java metadata/graphics/show/Boolean/ShowPits.java
 *
 * @remarks Only used by a specific number of board styles when creating the
 * board's design (e.g. Mancala).
 */

/**
 * @java metadata/graphics/show/Boolean/ShowPits.java — class ShowPits implements GraphicsItem
 */
export class ShowPits {
  /** If the pits should be marked. */
  readonly showPits: boolean;

  /**
   * @param showPits Whether the pits should be marked or not [true].
   */
  constructor(showPits: boolean | null) {
    this.showPits = showPits === null ? true : showPits;
  }

  /** @return If the pits should be marked. */
  isShowPits(): boolean {
    return this.showPits;
  }

  needRedraw(): boolean {
    return false;
  }
}

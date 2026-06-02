/**
 * Indicates whether the player's holes on the board should be marked with their owner.
 *
 * @java metadata/graphics/show/Boolean/ShowPlayerHoles.java
 *
 * @remarks Only used by a specific number of board styles when creating the
 * board's design (e.g. Mancala).
 */

/**
 * @java metadata/graphics/show/Boolean/ShowPlayerHoles.java — class ShowPlayerHoles implements GraphicsItem
 */
export class ShowPlayerHoles {
  /** If the player's holes should be marked. */
  readonly showPlayerHoles: boolean;

  /**
   * @param showPlayerHoles Whether the player's holes should be marked or not [true].
   */
  constructor(showPlayerHoles: boolean | null) {
    this.showPlayerHoles = showPlayerHoles === null ? true : showPlayerHoles;
  }

  /** @return If the player's holes should be marked. */
  isShowPlayerHoles(): boolean {
    return this.showPlayerHoles;
  }

  needRedraw(): boolean {
    return false;
  }
}

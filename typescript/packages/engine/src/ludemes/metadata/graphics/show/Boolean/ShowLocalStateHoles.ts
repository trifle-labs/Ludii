/**
 * Indicates whether the holes with a local state of zero on the board should be
 * marked with their owner.
 *
 * @java metadata/graphics/show/Boolean/ShowLocalStateHoles.java
 *
 * @remarks Only used by a specific number of board styles when creating the
 * board's design (e.g. Mancala).
 */

/**
 * @java metadata/graphics/show/Boolean/ShowLocalStateHoles.java — class ShowLocalStateHoles implements GraphicsItem
 */
export class ShowLocalStateHoles {
  /** If the holes with a local state of zero should be marked. */
  readonly useLocalState: boolean;

  /**
   * @param useLocalState If the holes with a local state of zero should be marked [true].
   */
  constructor(useLocalState: boolean | null) {
    this.useLocalState = useLocalState === null ? true : useLocalState;
  }

  /** @return If the holes with a local state of zero should be marked. */
  isUseLocalState(): boolean {
    return this.useLocalState;
  }

  needRedraw(): boolean {
    return false;
  }
}

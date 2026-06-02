/**
 * Indicates whether straight edges should be shown.
 *
 * @java metadata/graphics/show/Boolean/ShowStraightEdges.java
 */

/**
 * @java metadata/graphics/show/Boolean/ShowStraightEdges.java — class ShowStraightEdges implements GraphicsItem
 */
export class ShowStraightEdges {
  /** If the straight edges should be shown. */
  readonly showStraightEdges: boolean;

  /**
   * @param showStraightEdges Whether the straight edges should be shown [true].
   */
  constructor(showStraightEdges: boolean | null) {
    this.showStraightEdges = showStraightEdges === null ? true : showStraightEdges;
  }

  /** @return If the straight edges should be shown. */
  isShowStraightEdges(): boolean {
    return this.showStraightEdges;
  }

  needRedraw(): boolean {
    return false;
  }
}

/**
 * Indicates whether curved edges should be shown.
 *
 * @java metadata/graphics/show/Boolean/ShowCurvedEdges.java
 */

/**
 * @java metadata/graphics/show/Boolean/ShowCurvedEdges.java — class ShowCurvedEdges implements GraphicsItem
 */
export class ShowCurvedEdges {
  /** If the curved edges should be shown. */
  readonly showCurvedEdges: boolean;

  /**
   * @param showCurvedEdges Whether the curved edges should be shown [true].
   */
  constructor(showCurvedEdges: boolean | null) {
    this.showCurvedEdges = showCurvedEdges === null ? true : showCurvedEdges;
  }

  /** @return If the curved edges should be shown. */
  isShowCurvedEdges(): boolean {
    return this.showCurvedEdges;
  }

  needRedraw(): boolean {
    return false;
  }
}

/**
 * Indicates whether the directions of the Edges should be shown (only valid for Graph Games).
 *
 * @java metadata/graphics/show/Boolean/ShowEdgeDirections.java
 */

/**
 * @java metadata/graphics/show/Boolean/ShowEdgeDirections.java — class ShowEdgeDirections implements GraphicsItem
 */
export class ShowEdgeDirections {
  /** If the edge directions should be shown. */
  readonly showEdgeDirections: boolean;

  /**
   * @param showEdgeDirections Whether the edge directions should be shown [true].
   */
  constructor(showEdgeDirections: boolean | null) {
    this.showEdgeDirections = showEdgeDirections === null ? true : showEdgeDirections;
  }

  /** @return If the edge directions should be shown. */
  isShowEdgeDirections(): boolean {
    return this.showEdgeDirections;
  }

  needRedraw(): boolean {
    return false;
  }
}

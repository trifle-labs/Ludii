/**
 * Indicates whether the cost of the different graph elements should be shown.
 *
 * @java metadata/graphics/show/Boolean/ShowCost.java
 */

/**
 * @java metadata/graphics/show/Boolean/ShowCost.java — class ShowCost implements GraphicsItem
 */
export class ShowCost {
  /** If the cost should be shown. */
  readonly showCost: boolean;

  /**
   * @param showCost Whether the cost should be shown [true].
   */
  constructor(showCost: boolean | null) {
    this.showCost = showCost === null ? true : showCost;
  }

  /** @return If the cost should be shown. */
  isShowCost(): boolean {
    return this.showCost;
  }

  needRedraw(): boolean {
    return false;
  }
}

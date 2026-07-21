/**
 * Indicates whether the owner of each region should be shown.
 *
 * @java metadata/graphics/show/Boolean/ShowRegionOwner.java
 *
 * @remarks This is useful for graph games to indicate special sites.
 */

/**
 * @java metadata/graphics/show/Boolean/ShowRegionOwner.java — class ShowRegionOwner implements GraphicsItem
 */
export class ShowRegionOwner {
  /** Whether to show the owner of each region. */
  readonly show: boolean;

  /**
   * @param show Whether to show the owner of each region [true].
   */
  constructor(show: boolean | null) {
    this.show = show === null ? true : show;
  }

  /** @return If the board should show the region owner. */
  isShow(): boolean {
    return this.show;
  }

  needRedraw(): boolean {
    return false;
  }
}

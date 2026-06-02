/**
 * ShowSitesShape.ts
 *
 * @java metadata/graphics/show/sites/ShowSitesShape.java
 *
 * Sets the shape of the board's cells.
 */

/**
 * @java metadata.graphics.show.sites.ShowSitesShape
 */
export class ShowSitesShape {
  /** Cell shape (string mirror of Java ShapeType enum). */
  readonly shape: string;

  /**
   * @param shape The shape of the board's cells.
   * @java ShowSitesShape(ShapeType)
   */
  constructor(shape: string) {
    this.shape = shape;
  }

  /** @java GraphicsItem.needRedraw() */
  needRedraw(): boolean {
    return false;
  }
}

// @java Core/src/metadata/graphics/others/HiddenImage.java HiddenImage
/**
 * Java parity:
 * - Core/src/metadata/graphics/others/HiddenImage.java — faithful data-class port.
 *   Draws a specified image when a piece is hidden.
 */

export class HiddenImage {
  private readonly _image: string;

  /**
   * @param image Name of the hidden image to draw.
   */
  constructor(image: string) {
    this._image = image;
  }

  /** @return Hidden image to draw. */
  public hiddenImage(): string {
    return this._image;
  }

  public needRedraw(): boolean {
    return false;
  }
}

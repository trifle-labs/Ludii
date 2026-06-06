// @java Player/src/app/utils/DrawnImageInfo.java

import type { ImageInfo } from "../../../../ViewController/src/util/ImageInfo.js";

/**
 * BufferedImage shim — in the browser a "buffered image" is an HTMLImageElement
 * or an ImageBitmap.  We use a minimal opaque type for faithful structural
 * equivalence; callers that need to blit it use canvas drawImage.
 *
 * @java java.awt.image.BufferedImage
 */
export type BufferedImage = unknown;

// -------------------------------------------------------------------------

/**
 * Object that links a drawn bufferedImage to other useful information about it.
 *
 * Faithful 1:1 port of app.utils.DrawnImageInfo.
 *
 * @author Matthew Stephenson (Java original)
 * @java app.utils.DrawnImageInfo
 */
export class DrawnImageInfo {

  private readonly _pieceImage: BufferedImage;
  private readonly _imageInfo: ImageInfo;

  // -------------------------------------------------------------------------

  /** @java DrawnImageInfo(BufferedImage, ImageInfo) */
  constructor(pieceImage: BufferedImage, imageInfo: ImageInfo) {
    this._pieceImage = pieceImage;
    this._imageInfo = imageInfo;
  }

  // -------------------------------------------------------------------------

  /** @java DrawnImageInfo#pieceImage() */
  pieceImage(): BufferedImage {
    return this._pieceImage;
  }

  /** @java DrawnImageInfo#imageInfo() */
  imageInfo(): ImageInfo {
    return this._imageInfo;
  }

  // -------------------------------------------------------------------------
}

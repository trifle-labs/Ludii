// @java Player/src/app/utils/BufferedImageUtil.java

import { Color } from "../../../../awt/index.js";
import { AffineTransform } from "../../../../awt/index.js";

// ---------------------------------------------------------------------------
// BufferedImage escape-hatch
//
// Java's BufferedImage is a pixel-backed image.  Since this package targets
// ES2022 (no DOM), we represent BufferedImage as a plain object with a
// pixel array (ARGB Int32Array), matching the existing shim pattern
// established in src/ludii/Common/src/graphics/qr_codes/ToImage.ts.
//
// For methods that compose images via Graphics2D transforms (flip, rotate,
// transform, resize), we faithfully describe the intended operation but
// delegate pixel work to a platform-supplied rendering back-end that callers
// can inject via BufferedImageUtil.setRenderer().
//
// @java java.awt.image.BufferedImage
// ---------------------------------------------------------------------------

/**
 * Pixel-backed BufferedImage shim.
 *
 * Mirrors the Java API surface used by BufferedImageUtil.
 *
 * @java java.awt.image.BufferedImage
 */
export interface BufferedImage {
  getWidth(): number;
  getHeight(): number;
  /** Packed ARGB pixel at (x, y). @java BufferedImage#getRGB(int,int) */
  getRGB(x: number, y: number): number;
  /** Set packed ARGB pixel at (x, y). @java BufferedImage#setRGB(int,int,int) */
  setRGB(x: number, y: number, rgb: number): void;
  /** Backing pixel array (ARGB, row-major) — TS convenience, not in Java API. */
  pixels: Int32Array;
}

/** @java new java.awt.image.BufferedImage(int,int,int) */
export function createBufferedImage(width: number, height: number): BufferedImage {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const pixels = new Int32Array(w * h); // 0x00000000 = fully transparent
  return {
    pixels,
    getWidth: () => w,
    getHeight: () => h,
    getRGB(x: number, y: number): number {
      return pixels[y * w + x] ?? 0;
    },
    setRGB(x: number, y: number, rgb: number): void {
      pixels[y * w + x] = rgb;
    },
  };
}

// ---------------------------------------------------------------------------
// Platform renderer escape-hatch
//
// Transform-heavy operations (flip, rotate, resize, join) require compositing
// which cannot be done purely in ES2022 without DOM.  A platform layer
// (e.g. browser wrapper) can inject a renderer by calling
//   BufferedImageUtil.setRenderer(impl)
//
// The default renderer falls back to a best-effort pure-JS implementation
// for simple transforms and a no-op copy for others.
// ---------------------------------------------------------------------------

/** @java java.awt.geom.AffineTransform — pixel-level composition */
export interface BufferedImageRenderer {
  transform(image: BufferedImage, at: AffineTransform): BufferedImage;
  resize(image: BufferedImage, newW: number, newH: number): BufferedImage;
  composite(dst: BufferedImage, src: BufferedImage, alpha: number): BufferedImage;
  drawOnto(dst: BufferedImage, src: BufferedImage, x: number, y: number): void;
}

let _renderer: BufferedImageRenderer | null = null;

/** Inject a platform renderer (call from the browser wrapper). */
export function setBufferedImageRenderer(renderer: BufferedImageRenderer): void {
  _renderer = renderer;
}

/**
 * Default pure-JS renderer (best-effort; only handles exact translations +
 * integer scales commonly needed by flip/rotate).
 */
function defaultRenderer(): BufferedImageRenderer {
  return {
    transform(image: BufferedImage, at: AffineTransform): BufferedImage {
      const w = image.getWidth();
      const h = image.getHeight();
      const out = createBufferedImage(w, h);
      const scaleX = at.getScaleX();
      const scaleY = at.getScaleY();
      const tx = at.getTranslateX();
      const ty = at.getTranslateY();
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const srcX = Math.round(scaleX * x + at.getShearX() * y + tx);
          const srcY = Math.round(at.getShearY() * x + scaleY * y + ty);
          if (srcX >= 0 && srcX < w && srcY >= 0 && srcY < h) {
            out.setRGB(x, y, image.getRGB(srcX, srcY));
          }
        }
      }
      return out;
    },
    resize(image: BufferedImage, newW: number, newH: number): BufferedImage {
      const sw = image.getWidth();
      const sh = image.getHeight();
      const out = createBufferedImage(newW, newH);
      for (let y = 0; y < newH; y++) {
        for (let x = 0; x < newW; x++) {
          const srcX = Math.min(sw - 1, Math.round((x / newW) * sw));
          const srcY = Math.min(sh - 1, Math.round((y / newH) * sh));
          out.setRGB(x, y, image.getRGB(srcX, srcY));
        }
      }
      return out;
    },
    composite(dst: BufferedImage, src: BufferedImage, alpha: number): BufferedImage {
      const w = dst.getWidth();
      const h = dst.getHeight();
      const out = createBufferedImage(w, h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const srcPx = src.getRGB(x, y);
          const a = ((srcPx >>> 24) & 0xff);
          const blended = (Math.round(a * alpha) << 24) |
            (srcPx & 0x00ffffff);
          out.setRGB(x, y, blended);
        }
      }
      return out;
    },
    drawOnto(dst: BufferedImage, src: BufferedImage, ox: number, oy: number): void {
      const sw = src.getWidth();
      const sh = src.getHeight();
      const dw = dst.getWidth();
      const dh = dst.getHeight();
      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          const dx = x + ox;
          const dy = y + oy;
          if (dx >= 0 && dx < dw && dy >= 0 && dy < dh) {
            dst.setRGB(dx, dy, src.getRGB(x, y));
          }
        }
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Minimal PlayerApp escape-hatch
// @java app.PlayerApp
// ---------------------------------------------------------------------------

/**
 * Minimal structural type for app.PlayerApp (not yet ported).
 * @java app.PlayerApp
 */
interface PlayerApp {
  bridge(): { settingsVC(): { displayFont(): { getSize(): number; getName(): string } } };
}

// ---------------------------------------------------------------------------

/**
 * Functions for helping out with image manipulation and rendering.
 *
 * @author Matthew Stephenson
 * @java app.utils.BufferedImageUtil
 */
export class BufferedImageUtil {

  // ---------------------------------------------------------------------------

  /**
   * Returns the active renderer, falling back to the default.
   */
  private static renderer(): BufferedImageRenderer {
    return _renderer ?? defaultRenderer();
  }

  // ---------------------------------------------------------------------------

  /**
   * Makes a buffered image translucent.
   *
   * @java BufferedImageUtil#makeImageTranslucent(BufferedImage, double)
   */
  public static makeImageTranslucent(
    source: BufferedImage | null,
    alpha: number,
  ): BufferedImage | null {
    if (source === null) return null;

    return BufferedImageUtil.renderer().composite(
      createBufferedImage(source.getWidth(), source.getHeight()),
      source,
      alpha,
    );
  }

  // ---------------------------------------------------------------------------

  /**
   * Flips a buffered image vertically.
   *
   * @java BufferedImageUtil#createFlippedVertically(BufferedImage)
   */
  public static createFlippedVertically(image: BufferedImage | null): BufferedImage | null {
    if (image === null) return null;

    const at = new AffineTransform();
    at.concatenate(AffineTransform.getScaleInstance(1, -1));
    at.concatenate(AffineTransform.getTranslateInstance(0, -image.getHeight()));
    return BufferedImageUtil.createTransformed(image, at);
  }

  // ---------------------------------------------------------------------------

  /**
   * Flips a buffered image horizontally.
   *
   * @java BufferedImageUtil#createFlippedHorizontally(BufferedImage)
   */
  public static createFlippedHorizontally(image: BufferedImage | null): BufferedImage | null {
    if (image === null) return null;

    const at = new AffineTransform();
    at.concatenate(AffineTransform.getScaleInstance(-1, 1));
    at.concatenate(AffineTransform.getTranslateInstance(-image.getWidth(), 0));
    return BufferedImageUtil.createTransformed(image, at);
  }

  // ---------------------------------------------------------------------------

  /**
   * Transforms a buffered image.
   *
   * @java BufferedImageUtil#createTransformed(BufferedImage, AffineTransform)
   */
  public static createTransformed(
    image: BufferedImage | null,
    at: AffineTransform,
  ): BufferedImage | null {
    if (image === null) return null;
    return BufferedImageUtil.renderer().transform(image, at);
  }

  // ---------------------------------------------------------------------------

  /**
   * Rotates a buffered image.
   *
   * @java BufferedImageUtil#rotateImageByDegrees(BufferedImage, double)
   */
  public static rotateImageByDegrees(img: BufferedImage | null, angle: number): BufferedImage | null {
    if (img === null) return null;

    const rads = (angle * Math.PI) / 180;
    const w = img.getWidth();
    const h = img.getHeight();

    const at = new AffineTransform();
    at.translate(0, 0);

    const x = Math.trunc(w / 2);
    const y = Math.trunc(h / 2);

    at.rotate(rads, x, y);
    return BufferedImageUtil.renderer().transform(img, at);
  }

  // ---------------------------------------------------------------------------

  /**
   * Resizes a buffered image.
   *
   * @java BufferedImageUtil#resize(BufferedImage, int, int)
   */
  public static resize(img: BufferedImage | null, newW: number, newH: number): BufferedImage | null {
    if (img === null) return null;

    const width = Math.max(1, newW);
    const height = Math.max(1, newH);

    return BufferedImageUtil.renderer().resize(img, width, height);
  }

  // ---------------------------------------------------------------------------

  /**
   * Sets all pixels of an image to a certain colour (masked pieces).
   * Use componentStyle.createPieceImageColourSVG instead when possible.
   *
   * @java BufferedImageUtil#setPixelsToColour(BufferedImage, Color)
   */
  public static setPixelsToColour(
    image: BufferedImage | null,
    colour: Color,
  ): BufferedImage | null {
    if (image === null) return null;

    const rgb = colour.getRGB();
    const w = image.getWidth();
    const h = image.getHeight();

    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        // Only non-transparent pixels (Java: image.getRGB(x,y) != 0x00)
        if (image.getRGB(x, y) !== 0x00) {
          image.setRGB(x, y, rgb);
        }
      }
    }

    return image;
  }

  // ---------------------------------------------------------------------------

  /**
   * Deep copies a buffered image.
   *
   * @java BufferedImageUtil#deepCopy(BufferedImage)
   */
  public static deepCopy(image: BufferedImage): BufferedImage {
    const copy = createBufferedImage(image.getWidth(), image.getHeight());
    copy.pixels.set(image.pixels);
    return copy;
  }

  // ---------------------------------------------------------------------------

  /**
   * Combines two bufferedImage objects together.
   *
   * @java BufferedImageUtil#joinBufferedImages(BufferedImage, BufferedImage)
   */
  public static joinBufferedImages(
    img1: BufferedImage,
    img2: BufferedImage,
  ): BufferedImage;

  /**
   * Combines two bufferedImage objects together, with specified offsets.
   *
   * @java BufferedImageUtil#joinBufferedImages(BufferedImage, BufferedImage, int, int)
   */
  public static joinBufferedImages(
    img1: BufferedImage,
    img2: BufferedImage,
    offsetX: number,
    offsetY: number,
  ): BufferedImage;

  public static joinBufferedImages(
    img1: BufferedImage,
    img2: BufferedImage,
    offsetX: number = 0,
    offsetY: number = 0,
  ): BufferedImage {
    const w = Math.max(img1.getWidth(), img2.getWidth());
    const h = Math.max(img1.getHeight(), img2.getHeight());
    const combined = createBufferedImage(w, h);
    const r = BufferedImageUtil.renderer();
    r.drawOnto(combined, img1, 0, 0);
    r.drawOnto(combined, img2, offsetX, offsetY);
    return combined;
  }

  // ---------------------------------------------------------------------------

  /**
   * Determines if a specified point overlaps an image in the graphics cache.
   *
   * @java BufferedImageUtil#pointOverlapsImage(Point, BufferedImage, Point)
   */
  public static pointOverlapsImage(
    p: { x: number; y: number },
    image: BufferedImage,
    imageDrawPosn: { x: number; y: number },
  ): boolean {
    try {
      const imageWidth = image.getWidth();
      const imageHeight = image.getHeight();

      const pixelOnImageX = p.x - imageDrawPosn.x;
      const pixelOnImageY = p.y - imageDrawPosn.y;

      if (
        pixelOnImageX < 0 ||
        pixelOnImageY < 0 ||
        pixelOnImageY > imageHeight ||
        pixelOnImageX > imageWidth
      ) {
        return false;
      }

      const pixelClicked = image.getRGB(pixelOnImageX, pixelOnImageY);
      // Check alpha channel (top 8 bits) != 0
      return ((pixelClicked >> 24) & 0xff) !== 0x00;
    } catch (_e) {
      return false;
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * Draws a String on top of a bufferedImage.
   *
   * Note: pixel-level text rendering is not supported in ES2022 without DOM.
   * This method is a no-op shim — a platform layer should override via
   * BufferedImageUtil.createImageWithTextOverride if needed.
   *
   * @java BufferedImageUtil#createImageWithText(PlayerApp, BufferedImage, String)
   */
  public static createImageWithText(
    _app: PlayerApp,
    image: BufferedImage,
    _string: string,
  ): BufferedImage {
    // g2d text rendering requires a Canvas2D context (DOM).
    // Escape-hatch: platform layer can intercept via the override hook below.
    if (BufferedImageUtil.createImageWithTextOverride !== null) {
      return BufferedImageUtil.createImageWithTextOverride(_app, image, _string);
    }
    // No-op fallback: return the image unchanged.
    return image;
  }

  /** Platform-supplied override for createImageWithText. */
  static createImageWithTextOverride:
    | ((app: PlayerApp, image: BufferedImage, string: string) => BufferedImage)
    | null = null;

  // ---------------------------------------------------------------------------
}

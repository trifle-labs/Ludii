// @java Player/src/app/utils/SVGUtil.java

/**
 * Minimal shim for java.awt.image.BufferedImage — in the browser port an SVG
 * image element is the closest equivalent. Because the TS project targets
 * ES2022 without the DOM lib, we use an opaque object whose concrete runtime
 * type is HTMLImageElement when running in a browser context.
 *
 * @java java.awt.image.BufferedImage (shim)
 */
export type SVGBufferedImage = {
  /** The raw SVG source string. */
  svgSource: string;
  /** Requested width (0 = natural). */
  width: number;
  /** Requested height (0 = natural). */
  height: number;
};

/**
 * Functions for helping out the SVG rendering.
 *
 * In the browser port, SVG strings are rendered by setting them as the src
 * of an HTMLImageElement (via a Blob URL), so there is no need for Apache
 * Batik's ImageTranscoder.  The returned object carries the SVG source and
 * the requested dimensions; the caller can materialise it into a DOM element
 * using the helper `svgBufferedImageToElement` below.
 *
 * @java app.utils.SVGUtil
 * @author Matthew Stephenson
 */
export class SVGUtil {

  // ---------------------------------------------------------------------------

  /**
   * Creates an SVGBufferedImage from an SVG string at the given width/height.
   * Returns null if the imageEntry is empty.
   *
   * Java original returns a BufferedImage; in the TS port we return an
   * opaque SVGBufferedImage that encapsulates the SVG source + dimensions.
   *
   * @java SVGUtil.createSVGImage(String, double, double)
   */
  public static createSVGImage(
    imageEntry: string,
    width: number,
    height: number,
  ): SVGBufferedImage | null {
    // Need this check in case of boardless board.
    if (imageEntry.length === 0) return null;

    let svgSource = imageEntry;

    // Inject explicit width/height attributes when requested.
    if (width > 0 && height > 0) {
      svgSource = svgSource.replace(
        /(<svg\b)([^>]*?>)/i,
        (_match: string, tag: string, rest: string) => {
          // Remove any existing width/height attributes then re-add.
          const cleaned = rest
            .replace(/\s+width="[^"]*"/gi, "")
            .replace(/\s+height="[^"]*"/gi, "");
          return `${tag} width="${width}" height="${height}"${cleaned}`;
        },
      );
    }

    return { svgSource, width, height };
  }

  // ---------------------------------------------------------------------------
}

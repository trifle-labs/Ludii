// @java Common/src/graphics/ImageUtil.java

/**
 * Functions for assisting with images.
 *
 * @java graphics/ImageUtil.java
 * @author Matthew.Stephenson
 */

import { ImageConstants } from "./ImageConstants.js";

/**
 * Escape-hatch for SVGLoader — not yet ported.
 * @java graphics.svg.SVGLoader
 */
type SVGLoaderType = {
  listSVGs(): string[];
};

// Use a no-op shim if the real SVGLoader is not available.
let _svgLoader: SVGLoaderType | null = null;

/** Register the SVGLoader implementation (call from the real SVGLoader port). */
export function registerSVGLoader(loader: SVGLoaderType): void {
  _svgLoader = loader;
}

function getSVGLoader(): SVGLoaderType {
  if (_svgLoader !== null) return _svgLoader;
  return { listSVGs: () => [] };
}

export class ImageUtil {
  // --------------------------------------------------------------------------

  /**
   * Determines the full file path of a specified image name.
   *
   * @java ImageUtil.getImageFullPath(String)
   */
  public static getImageFullPath(imageName: string): string | null {
    const imageNameLower = imageName.toLowerCase();
    const svgNames = getSVGLoader().listSVGs();

    // Pass 1: Look for exact match
    for (const svgName of svgNames) {
      const sReplaced = svgName.replace(/\\/g, "/");
      const subs = sReplaced.split("/");
      if (subs[subs.length - 1]!.toLowerCase() === imageNameLower + ".svg") {
        let fullPath = svgName.replace(/\\/g, "/");
        fullPath = fullPath.substring(fullPath.indexOf("/svg/"));
        return fullPath;
      }
    }

    // Pass 2: Look for exact match outside of the Jar, at root location.
    // In TypeScript/browser context there is no filesystem access equivalent;
    // this block is intentionally a no-op (faithfully preserved as comment).
    // Java: File svgImage = new File("."); iterate files …

    // Handle predefined image types that do not have an SVG
    if (ImageConstants.customImageKeywords.includes(imageNameLower)) {
      return imageNameLower;
    }

    // Pass 3: Look for best substring match
    let longestName: string | null = null;
    let longestNamePath: string | null = null;
    for (const svgName of svgNames) {
      const sReplaced = svgName.replace(/\\/g, "/");
      const subs = sReplaced.split("/");
      const shortName = subs[subs.length - 1]!.split(".")[0]!.toLowerCase();

      if (imageNameLower.includes(shortName)) {
        let fullPath = svgName.replace(/\\/g, "/");
        fullPath = fullPath.substring(fullPath.indexOf("/svg/"));
        if (longestName === null || shortName.length > longestName.length) {
          longestName = shortName;
          longestNamePath = fullPath;
        }
      }
    }

    return longestNamePath;
  }

  // --------------------------------------------------------------------------
}

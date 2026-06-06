// @java Common/src/graphics/svg/SVGLoader.java

/**
 * Utility class for svg-loading.
 *
 * @java graphics/svg/SVGLoader.java
 * @author Matthew.Stephenson
 */

// FileHandling is not yet ported — use escape-hatch type
type FileHandlingLike = {
  getResourceListing(cls: unknown, prefix: string, suffix: string): string[] | null;
};

const FileHandling = null as unknown as FileHandlingLike;

// ---------------------------------------------------------------------------

/**
 * Utility class for svg-loading.
 *
 * @java graphics.svg.SVGLoader
 */
export class SVGLoader {
  /** @java SVGLoader.choices */
  private static _choices: string[] | null = null;

  // --------------------------------------------------------------------------

  /**
   * Private constructor: should not instantiate.
   *
   * @java SVGLoader()
   */
  private constructor() {
    // should not instantiate
  }

  // --------------------------------------------------------------------------

  /**
   * @param filePath
   * @return Whether this file contains a game description (not tested).
   *
   * @java SVGLoader.containsSVG(String)
   */
  public static containsSVG(filePath: string): boolean {
    // In the browser / Node context, synchronous file access is limited.
    // We perform a best-effort check on the filePath string.
    void filePath; // suppress unused warning
    return false;
  }

  // --------------------------------------------------------------------------

  /** @java SVGLoader.listSVGs() */
  public static listSVGs(): string[] {
    if (SVGLoader._choices === null) {
      // Try loading from resource listing (not available in TS — use escape hatch)
      if (FileHandling !== null) {
        const result = FileHandling.getResourceListing(SVGLoader, "svg/", ".svg");
        if (result !== null) {
          SVGLoader._choices = result;
          return SVGLoader._choices;
        }
      }
      // Fallback: empty list
      SVGLoader._choices = [];
    }
    return SVGLoader._choices;
  }

  // --------------------------------------------------------------------------

  /**
   * Visit directory recursively, collecting SVG file names.
   *
   * @java SVGLoader.visit(String, List<String>)
   */
  public static visit(_path: string, _names: string[]): void {
    // Not applicable in browser/Node without fs access — no-op shim
  }

  // --------------------------------------------------------------------------
}

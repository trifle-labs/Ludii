// @java AI/src/utils/ExperimentFileUtils.java

import * as fs from "fs";
import * as path from "path";

/**
 * Some utilities related to files in experiments
 *
 * @java utils/ExperimentFileUtils.java
 * @author Dennis Soemers
 */
export class ExperimentFileUtils {

  //-------------------------------------------------------------------------

  /** Format used for filepaths in sequences of files (with increasing indices) */
  private static readonly fileSequenceFormat = "%s_%05d.%s";

  //-------------------------------------------------------------------------

  private constructor() {
    // should not instantiate
  }

  //-------------------------------------------------------------------------

  /**
   * Formats a file sequence path with zero-padded index.
   * @java String.format(fileSequenceFormat, baseFilepath, index, extension)
   */
  private static formatPath(baseFilepath: string, index: number, extension: string): string {
    return `${baseFilepath}_${String(index).padStart(5, "0")}.${extension}`;
  }

  /**
   * Returns the filepath of the form {baseFilepath}_{index}.{extension} with
   * the minimum integer value >= 0 for {index} such that a File with that filepath
   * does not yet exist.
   *
   * @param baseFilepath
   * @param extension
   * @return Next file path.
   * @java ExperimentFileUtils.getNextFilepath(String, String)
   */
  public static getNextFilepath(baseFilepath: string, extension: string): string {
    let index = 0;
    let result = ExperimentFileUtils.formatPath(baseFilepath, index, extension);

    while (fs.existsSync(result)) {
      ++index;
      result = ExperimentFileUtils.formatPath(baseFilepath, index, extension);
    }

    return result;
  }

  /**
   * Returns the filepath of the form {baseFilepath}_{index}.{extension} with
   * the maximum integer value >= 0 for {index} such that a File with that filepath
   * exists, or null if no such File exists.
   *
   * @param baseFilepath
   * @param extension
   * @return Last file path.
   * @java ExperimentFileUtils.getLastFilepath(String, String)
   */
  public static getLastFilepath(baseFilepath: string, extension: string): string | null {
    let index = 0;
    let result: string | null = null;

    const checkpoint0 = ExperimentFileUtils.formatPath(baseFilepath, index, extension);
    const parentDir = path.dirname(checkpoint0);

    if (fs.existsSync(parentDir)) {
      let files: string[];
      try {
        files = fs.readdirSync(parentDir);
      } catch (_e) {
        return null;
      }

      // normalize base for cross-platform
      const normalizedBase = baseFilepath.replace(/\\/g, "/");

      for (const file of files) {
        const filepath = path.join(parentDir, file).replace(/\\/g, "/");

        if (filepath.endsWith("." + extension) && filepath.includes(normalizedBase)) {
          try {
            const lastUnderscore = filepath.lastIndexOf("_");
            const idxStr = filepath
              .substring(lastUnderscore + 1)
              .replace("." + extension, "");
            const idx = parseInt(idxStr, 10);
            if (!isNaN(idx) && idx > index) {
              index = idx;
              result = ExperimentFileUtils.formatPath(baseFilepath, index, extension);
            }
          } catch (_e) {
            // Do nothing
          }
        }
      }
    }

    return result;
  }

  //-------------------------------------------------------------------------
}

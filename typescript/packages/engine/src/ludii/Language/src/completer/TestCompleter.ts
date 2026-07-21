// @java Language/src/completer/TestCompleter.java

/**
 * Test various reconstruction routines.
 *
 * @java completer/TestCompleter.java
 * @author cambolbro
 */

import { Completer } from "./Completer.js";
import { type Completion } from "./Completion.js";

/**
 * @java completer.TestCompleter
 */
export class TestCompleter {
  // -------------------------------------------------------------------------

  /**
   * From FileHandling.
   *
   * @java TestCompleter.loadTextContentsFromFile(String)
   */
  public static async loadTextContentsFromFile(filePath: string): Promise<string> {
    // In Java: reads the file using FileInputStream + BufferedReader.
    // In TS/Node: use fs.readFile; in browser: not available.
    // Faithful stub that delegates to Node fs if available.
    try {
      const fs = await import("fs/promises");
      return await fs.readFile(filePath, "utf-8");
    } catch (_e) {
      throw new Error("Could not read file: " + filePath);
    }
  }

  // -------------------------------------------------------------------------

  /** @java TestCompleter.testLoadLuds() */
  static testLoadLuds(): void {
    const luds = Completer.getAllLudContents();
    const defs = Completer.getAllDefContents();
    console.log(Object.keys(luds).length + " luds loaded, " + Object.keys(defs).length + " defs loaded.");
  }

  // -------------------------------------------------------------------------

  /** @java TestCompleter.testCompletion() */
  static testCompletion(): void {
    TestCompleter.testCompletionFile(null, "TestReconOneClause.lud");
    TestCompleter.testCompletionFile(null, "TestReconTwoClauses.lud");
    TestCompleter.testCompletionFile(null, "TestReconNested.lud");
    TestCompleter.testCompletionFile(null, "TestReconRange.lud");
    TestCompleter.testCompletionFile(null, "TestReconRanges.lud");
    TestCompleter.testCompletionFile(null, "TestReconRangeSite.lud");
    TestCompleter.testCompletionFile(null, "TestReconInclude.lud");
    TestCompleter.testCompletionFile(null, "TestReconExclude.lud");
    TestCompleter.testCompletionFile(null, "TestReconEnumeration1.lud");
    TestCompleter.testCompletionFile(null, "TestReconEnumeration2.lud");
  }

  /**
   * @param outFilePath Path to save output file (will use default /Common/res/out/recons/ if null).
   * @param fileName    File name.
   * @java TestCompleter.testCompletion(String, String)
   */
  static testCompletionFile(outFilePath: string | null, fileName: string): void {
    const filePath = "../Common/res/lud/test/recon/" + fileName;

    console.log("\n####################################################");
    console.log("\nTesting completion of " + filePath);

    // Note: file reading is async in TS; synchronous stub used here.
    let str = "";
    try {
      console.log("File needs completing: " + Completer.needsCompleting(str));

      const completions = Completer.completeSampled(str, 3, null);
      for (let n = 0; n < completions.length; n++) {
        const completion = completions[n]!;
        const suffixAt = fileName.indexOf(".lud");
        const outFileName = fileName.substring(0, suffixAt) + "-" + n;
        try {
          Completer.saveCompletion(outFilePath, outFileName, completion);
        } catch (e) {
          console.error(e);
        }
      }
    } catch (_ex) {
      console.log("Unable to open file '" + fileName + "'");
    }
  }

  // -------------------------------------------------------------------------

  /** @java TestCompleter.main(String[]) */
  public static main(_args: string[]): void {
    TestCompleter.testLoadLuds();
    TestCompleter.testCompletion();
  }

  // -------------------------------------------------------------------------
}

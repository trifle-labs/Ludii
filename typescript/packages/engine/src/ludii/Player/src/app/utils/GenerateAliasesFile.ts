// @java Player/src/app/utils/GenerateAliasesFile.java

/**
 * Minimal structural interface for FileHandling (escape-hatch for not-yet-ported dep).
 * @java main.FileHandling
 */
interface IFileHandling {
  loadTextContentsFromFile(path: string): string;
  listFiles(dir: string): string[];
  isDirectory(path: string): boolean;
}

/**
 * Minimal structural interface for StringRoutines (escape-hatch for not-yet-ported dep).
 * @java main.StringRoutines
 */
interface IStringRoutines {
  matchingBracketAt(s: string, idx: number): number;
  matchingQuoteAt(s: string, idx: number): number;
}

// -------------------------------------------------------------------------

/**
 * Small class with main method to generate our resource file containing
 * aliases of games.
 *
 * Faithful 1:1 port of app.utils.GenerateAliasesFile.
 *
 * File I/O (java.io.PrintWriter, java.io.FileOutputStream, etc.) are not
 * available in the browser.  The logic is ported faithfully; callers must
 * inject concrete implementations of IFileHandling, IStringRoutines, and a
 * writer callback.
 *
 * @author Dennis Soemers (Java original)
 * @java app.utils.GenerateAliasesFile
 */
export class GenerateAliasesFile {

  /** @java GenerateAliasesFile.ALIASES_FILEPATH */
  static readonly ALIASES_FILEPATH = "../Common/res/help/Aliases.txt";

  // -------------------------------------------------------------------------

  /**
   * Private constructor — do not instantiate.
   * @java GenerateAliasesFile()
   */
  private constructor() {
    // Do not instantiate
  }

  // -------------------------------------------------------------------------

  /**
   * Generates the aliases file content and writes it using the supplied writer.
   *
   * In Java this is `main(String[])`.  In TS we expose a static method that
   * accepts injectable helpers so the file-system logic can be tested without
   * a real filesystem.
   *
   * @java GenerateAliasesFile#main(String[])
   */
  static generate(
    fileHandling: IFileHandling,
    stringRoutines: IStringRoutines,
    writeLine: (line: string) => void,
  ): void {
    const startFolder = "../Common/res/lud/";
    const gameDirs: string[] = [startFolder];
    const entries: string[] = [];

    const ignoredPaths = [
      "../Common/res/lud/plex",
      "../Common/res/lud/wishlist",
      "../Common/res/lud/WishlistDLP",
      "../Common/res/lud/wip",
      "../Common/res/lud/test",
      "../Common/res/lud/bad",
      "../Common/res/lud/bad_playout",
      "../Common/res/lud/subgame",
      "../Common/res/lud/reconstruction",
    ];

    for (let i = 0; i < gameDirs.length; ++i) {
      const gameDir = gameDirs[i]!;
      for (const fileEntryPath of fileHandling.listFiles(gameDir)) {
        const normalised = fileEntryPath.replace(/\\/g, "/");
        if (fileHandling.isDirectory(fileEntryPath)) {
          if (ignoredPaths.includes(normalised)) continue;
          gameDirs.push(fileEntryPath);
        } else if (fileEntryPath.includes(".lud")) {
          entries.push(fileEntryPath);
        }
      }
    }

    for (const fileEntryPath of entries) {
      console.log("Processing: " + fileEntryPath + "...");

      const fileContents = fileHandling.loadTextContentsFromFile(fileEntryPath);
      const metadataStart = fileContents.indexOf("(metadata");
      if (metadataStart < 0) continue;
      const metadataEnd = stringRoutines.matchingBracketAt(fileContents, metadataStart);
      const metadataString = fileContents.substring(metadataStart, metadataEnd);

      const aliases: string[] = [];

      const aliasesPrefix = "(aliases ";
      const aliasesStart = metadataString.indexOf("(aliases {") + aliasesPrefix.length;
      if (aliasesStart >= aliasesPrefix.length) {
        const aliasesEnd = stringRoutines.matchingBracketAt(metadataString, aliasesStart);
        const aliasStrings = metadataString.substring(aliasesStart + 1, aliasesEnd);

        let nextOpenQuoteIdx = aliasStrings.indexOf("\"", 0);
        while (nextOpenQuoteIdx >= 0) {
          const nextClosingQuoteIdx = stringRoutines.matchingQuoteAt(aliasStrings, nextOpenQuoteIdx);
          if (nextClosingQuoteIdx >= 0) {
            aliases.push(aliasStrings.substring(nextOpenQuoteIdx + 1, nextClosingQuoteIdx));
          }
          nextOpenQuoteIdx = aliasStrings.indexOf("\"", nextClosingQuoteIdx + 1);
        }
      }

      if (aliases.length > 0) {
        // First print the game path
        const normalisedPath = fileEntryPath.replace(/\\/g, "/");
        const ludPathStartIdx = normalisedPath.indexOf("/lud/");
        writeLine(normalisedPath.substring(ludPathStartIdx));

        // Now print the aliases
        for (const alias of aliases) {
          writeLine(alias);
        }
      }
    }

    console.log("Finished processing aliases.");
    console.log("Wrote to file: " + GenerateAliasesFile.ALIASES_FILEPATH);
  }

  // -------------------------------------------------------------------------
}

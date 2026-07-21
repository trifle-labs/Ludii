// @java Core/src/other/GameLoader.java
/**
 * Faithful 1:1 transliteration of other.GameLoader.
 *
 * Utility class for game-loading.
 *
 * Deferrals / environment differences:
 *  - Java classpath resource streams (GameLoader.class.getResourceAsStream)
 *    are not available in TS/Node.  The raw stream-access methods
 *    (loadGameFromName with options, loadGameFromFile with options) throw a
 *    clear Error indicating the environment limitation.  All PURE logic
 *    (path building, fuzzy-name resolution, convertStringsToOptions,
 *    getFilePath, allAnalysisGameRulesetNames, compileInstance) is
 *    transliterated faithfully.
 *  - Java types replaced by minimal local interfaces:
 *      Game          → IGame
 *      Subgame       → ISubgame
 *      Ruleset       → IRuleset
 *      GameOptions   → IGameOptions
 *      Option        → IOption
 *      OptionCategory→ IOptionCategory
 *  - FileHandling.listGames / FileHandling.shouldIgnoreLudAnalysis are
 *    injectable via FileHandling interface.
 *  - Compiler.compile is injectable via ICompiler interface.
 *
 * Java parity: other/GameLoader.java
 *
 * @author Dennis Soemers and cambolbro (Java), ported to TS
 */

// ---------------------------------------------------------------------------
// Minimal opaque interfaces for types that live in other engine modules.
// ---------------------------------------------------------------------------

/** @java game.Game */
export interface IGame {
  hasSubgames(): boolean;
  instances(): ISubgame[];
  description(): IDescription;
}

/** @java game.match.Subgame */
export interface ISubgame {
  gameName(): string;
  optionName(): string | null;
  setGame(game: IGame): void;
}

/** @java main.grammar.Description */
export interface IDescription {
  rulesets(): IRuleset[] | null;
}

/** @java main.options.Ruleset */
export interface IRuleset {
  heading(): string;
  optionSettings(): string[];
}

/** @java main.options.Option */
export interface IOption {
  menuHeadings(): string[];
  setHeadings(headings: string[]): void;
}

/** @java main.options.OptionCategory */
export interface IOptionCategory {
  options(): IOption[];
}

/** @java main.options.GameOptions */
export interface IGameOptions {
  numCategories(): number;
  categories(): IOptionCategory[];
  setOptionCategories(optionsAvailable: IOption[][]): void;
}

/**
 * Injectable stand-in for main.FileHandling static methods.
 * @java main.FileHandling
 */
export interface IFileHandling {
  listGames(): string[];
  shouldIgnoreLudAnalysis(lud: string): boolean;
}

/**
 * Injectable stand-in for compiler.Compiler.compile.
 * @java compiler.Compiler
 */
export interface ICompiler {
  compile(
    description: ICompileDescription,
    userSelections: IUserSelections,
    report: IReport,
    isVerbose: boolean
  ): IGame;
}

/** @java main.grammar.Description (as passed to Compiler.compile) */
export interface ICompileDescription {
  text: string;
}

/** @java main.options.UserSelections */
export interface IUserSelections {
  options: string[];
}

/** @java main.grammar.Report */
export interface IReport {}

// ---------------------------------------------------------------------------
// Default stubs for environment-unavailable operations
// ---------------------------------------------------------------------------

/**
 * Throws for any classpath resource stream access that is not available
 * in a pure TS/Node environment.
 */
function notAvailable(method: string): never {
  throw new Error(
    `GameLoader: ${method} — classpath resource access is not available in this environment.`
  );
}

// ---------------------------------------------------------------------------
// GameLoader
// ---------------------------------------------------------------------------

/**
 * Utility class for game-loading.
 *
 * @java other.GameLoader
 */
export class GameLoader {
  // -------------------------------------------------------------------------
  // Injectable dependencies (not present in Java where they are static
  // class-path / classpath calls; provided here for TS portability).
  // -------------------------------------------------------------------------

  /** Injectable FileHandling. Must be set before calling methods that list games. */
  static fileHandling: IFileHandling | null = null;

  /** Injectable Compiler. Must be set before calling compile-dependent methods. */
  static compiler: ICompiler | null = null;

  // -------------------------------------------------------------------------

  /**
   * Load game from name.
   *
   * @param name Filename + .lud extension.
   * @return Loads game for the given name.
   * @java GameLoader#loadGameFromName(String name)
   */
  static loadGameFromName(name: string): IGame;

  /**
   * Load game from name with a ruleset name.
   *
   * @param name Filename + .lud extension.
   * @param rulesetName Name of the ruleset to load.
   * @return Loads game for the given name.
   * @java GameLoader#loadGameFromName(String name, String rulesetName)
   */
  static loadGameFromName(name: string, rulesetName: string): IGame;

  /**
   * Load game from name with options.
   *
   * @param name Filename + .lud extension.
   * @param options List of options to select.
   * @return Loads game for the given name.
   * @java GameLoader#loadGameFromName(String name, List<String> options)
   */
  static loadGameFromName(name: string, options: string[]): IGame;

  static loadGameFromName(
    name: string,
    optionsOrRulesetName?: string | string[]
  ): IGame {
    if (optionsOrRulesetName === undefined) {
      // @java GameLoader#loadGameFromName(String name)
      return GameLoader._loadGameFromNameWithOptions(name, []);
    }

    if (typeof optionsOrRulesetName === 'string') {
      // @java GameLoader#loadGameFromName(String name, String rulesetName)
      const rulesetName = optionsOrRulesetName;

      if (rulesetName.length === 0) {
        return GameLoader.loadGameFromName(name);
      }

      const tempGame = GameLoader.loadGameFromName(name);
      const rulesets = tempGame.description().rulesets();
      if (rulesets !== null && rulesets.length > 0) {
        for (let rs = 0; rs < rulesets.length; rs++) {
          if (rulesets[rs]!.heading() === rulesetName) {
            return GameLoader._loadGameFromNameWithOptions(
              name,
              rulesets[rs]!.optionSettings()
            );
          }
        }
      }

      console.error('ERROR: Ruleset name not found, loading default game options');
      console.error(`Game name = ${name}`);
      console.error(`Ruleset name = ${rulesetName}`);
      return GameLoader.loadGameFromName(name);
    }

    // @java GameLoader#loadGameFromName(String name, List<String> options)
    return GameLoader._loadGameFromNameWithOptions(name, optionsOrRulesetName);
  }

  // -------------------------------------------------------------------------

  /**
   * Internal implementation — loads by name + options, mirroring the Java
   * method that calls getResourceAsStream.
   *
   * In Java this opens the .lud resource from the classpath. In TS that is
   * not possible, so the raw stream step throws. The pure path-building
   * and name-fuzzy-matching logic is faithfully ported.
   *
   * @java GameLoader#loadGameFromName(String, List<String>) — body
   */
  private static _loadGameFromNameWithOptions(
    name: string,
    options: string[]
  ): IGame {
    // @java InputStream in = GameLoader.class.getResourceAsStream(...)
    // Not available in TS:
    notAvailable('_loadGameFromNameWithOptions (classpath getResourceAsStream)');
  }

  // -------------------------------------------------------------------------

  /**
   * Load game from file.
   *
   * @param filePath Absolute path to the .lud file.
   * @return Game loaded from file.
   * @java GameLoader#loadGameFromFile(File file)
   */
  static loadGameFromFile(filePath: string): IGame;

  /**
   * Load game from file with ruleset name.
   *
   * @param filePath Absolute path to the .lud file.
   * @param rulesetName Name of the ruleset to load.
   * @return Loads game for the given name.
   * @java GameLoader#loadGameFromFile(File file, String rulesetName)
   */
  static loadGameFromFile(filePath: string, rulesetName: string): IGame;

  /**
   * Load game from file with options.
   *
   * @param filePath Absolute path to the .lud file.
   * @param options List of options to select.
   * @return Game loaded from file.
   * @java GameLoader#loadGameFromFile(File file, List<String> options)
   */
  static loadGameFromFile(filePath: string, options: string[]): IGame;

  static loadGameFromFile(
    filePath: string,
    optionsOrRulesetName?: string | string[]
  ): IGame {
    if (optionsOrRulesetName === undefined) {
      // @java GameLoader#loadGameFromFile(File file)
      return GameLoader._loadGameFromFileWithOptions(filePath, []);
    }

    if (typeof optionsOrRulesetName === 'string') {
      // @java GameLoader#loadGameFromFile(File file, String rulesetName)
      const rulesetName = optionsOrRulesetName;

      if (rulesetName.length === 0) {
        return GameLoader.loadGameFromFile(filePath);
      }

      const tempGame = GameLoader.loadGameFromFile(filePath);
      const rulesets = tempGame.description().rulesets();
      if (rulesets !== null && rulesets.length > 0) {
        for (let rs = 0; rs < rulesets.length; rs++) {
          if (rulesets[rs]!.heading() === rulesetName) {
            return GameLoader._loadGameFromFileWithOptions(
              filePath,
              rulesets[rs]!.optionSettings()
            );
          }
        }
      }

      console.error('ERROR: Ruleset name not found, loading default game options');
      console.error(`Game file = ${filePath}`);
      console.error(`Ruleset name = ${rulesetName}`);
      return GameLoader.loadGameFromFile(filePath);
    }

    // @java GameLoader#loadGameFromFile(File file, List<String> options)
    return GameLoader._loadGameFromFileWithOptions(filePath, optionsOrRulesetName);
  }

  // -------------------------------------------------------------------------

  /**
   * Internal implementation — loads from file path + options, mirroring the
   * Java method that opens a FileInputStream.
   *
   * In Java this reads the file via FileInputStream + BufferedReader. In TS,
   * this uses a stub that throws because the classpath stream is unavailable.
   * Callers that have a real fs implementation should replace this stub.
   *
   * @java GameLoader#loadGameFromFile(File, List<String>) — body
   */
  private static _loadGameFromFileWithOptions(
    _filePath: string,
    _options: string[]
  ): IGame {
    // @java FileInputStream + BufferedReader — not available via classpath in TS
    notAvailable('_loadGameFromFileWithOptions (FileInputStream read)');
  }

  // -------------------------------------------------------------------------

  /**
   * @param optionStrings
   * @param gameOptions
   * @return int array representation of selected options.
   * @java GameLoader#convertStringsToOptions(List<String>, GameOptions)
   */
  static convertStringsToOptions(
    optionStrings: string[],
    gameOptions: IGameOptions
  ): number[] {
    // @java final int[] optionSelections = new int[GameOptions.MAX_OPTION_CATEGORIES];
    const MAX_OPTION_CATEGORIES = 10; // @java GameOptions.MAX_OPTION_CATEGORIES
    const optionSelections: number[] = new Array<number>(MAX_OPTION_CATEGORIES).fill(0);

    for (const optionStr of optionStrings) {
      // @java final String[] headings = optionStr.split(Pattern.quote("/"));
      const headings = optionStr.split('/');
      let foundMatch = false;

      for (let cat = 0; cat < gameOptions.numCategories(); cat++) {
        // @java final List<Option> optionsList = gameOptions.categories().get(cat).options();
        const optionsList = gameOptions.categories()[cat]!.options();

        for (let i = 0; i < optionsList.length; ++i) {
          const option = optionsList[i]!;
          // @java final List<String> optionHeadings = option.menuHeadings();
          const optionHeadings = option.menuHeadings();

          if (optionHeadings.length !== headings.length) {
            continue;
          }

          let allMatch = true;
          for (let j = 0; j < headings.length; ++j) {
            if (headings[j]!.toLowerCase() !== optionHeadings[j]!.toLowerCase()) {
              allMatch = false;
              break;
            }
          }

          if (allMatch) {
            foundMatch = true;
            optionSelections[cat] = i;
            break;
          }
        }

        if (foundMatch) {
          break;
        }
      }

      if (!foundMatch) {
        console.error(
          `Warning! GameLoader::convertStringToOptions() could not resolve option: ${optionStr}`
        );
      }
    }

    return optionSelections;
  }

  // -------------------------------------------------------------------------

  /**
   * Returns the complete file path for a given lud name.
   *
   * In Java this opens a classpath stream via getResourceAsStream to verify
   * existence; in TS the stream check stubs throw. The path-building and
   * fuzzy-matching logic is faithfully ported.
   *
   * @param name The name of the game.
   * @return The file path, or null if not found externally.
   * @java GameLoader#getFilePath(String name)
   */
  static getFilePath(name: string): string | null {
    // @java inName = name.replaceAll(Pattern.quote("\\"), "/")
    let inName = name.replace(/\\/g, '/');

    if (!inName.endsWith('.lud')) {
      inName += '.lud';
    }

    if (inName.startsWith('../Common/res')) {
      inName = inName.substring('../Common/res'.length);
    }

    if (!inName.startsWith('/lud/')) {
      inName = '/lud/' + inName;
    }

    // @java try (InputStream in = GameLoader.class.getResourceAsStream(inName))
    // In TS: we cannot open a classpath stream — perform the fuzzy-match logic
    // faithfully, but the existence check (in == null) is treated as always
    // needing the fuzzy search unless the caller provides FileHandling.

    if (GameLoader.fileHandling === null) {
      throw new Error(
        'GameLoader.getFilePath: GameLoader.fileHandling must be set before calling getFilePath.'
      );
    }

    // @java if (in == null) { ... fuzzy match ... }
    const allGameNames = GameLoader.fileHandling.listGames();
    let shortestNonMatchLength = Number.MAX_SAFE_INTEGER;
    let bestMatchFilepath: string | null = null;

    // @java String givenName = inName.toLowerCase().replaceAll(...)
    let givenName = inName.toLowerCase().replace(/\\/g, '/');

    if (givenName.startsWith('/lud/')) {
      givenName = givenName.substring('/lud/'.length);
    } else if (givenName.startsWith('lud/')) {
      givenName = givenName.substring('lud/'.length);
    }

    // First pass: endsWith("/" + givenName)
    for (const gameName of allGameNames) {
      const str = gameName.toLowerCase().replace(/\\/g, '/');

      if (str.endsWith('/' + givenName)) {
        const nonMatchLength = str.length - givenName.length;
        if (nonMatchLength < shortestNonMatchLength) {
          shortestNonMatchLength = nonMatchLength;
          bestMatchFilepath = '..\\Common\\res\\' + gameName;
        }
      }
    }

    // Second pass if still null: endsWith(givenName)
    if (bestMatchFilepath === null) {
      for (const gameName of allGameNames) {
        const str = gameName.toLowerCase().replace(/\\/g, '/');
        if (str.endsWith(givenName)) {
          const nonMatchLength = str.length - givenName.length;
          if (nonMatchLength < shortestNonMatchLength) {
            shortestNonMatchLength = nonMatchLength;
            bestMatchFilepath = '..\\Common\\res\\' + gameName;
          }
        }
      }
    }

    // Third pass if still null: endsWith(last component of givenName)
    if (bestMatchFilepath === null) {
      const givenSplit = givenName.split('/');
      if (givenSplit.length > 1) {
        const givenEnd = givenSplit[givenSplit.length - 1]!;
        for (const gameName of allGameNames) {
          const str = gameName.toLowerCase().replace(/\\/g, '/');
          if (str.endsWith(givenEnd)) {
            const nonMatchLength = str.length - givenName.length;
            if (nonMatchLength < shortestNonMatchLength) {
              shortestNonMatchLength = nonMatchLength;
              bestMatchFilepath = '..\\Common\\res\\' + gameName;
            }
          }
        }
      }
    }

    // Probably loading an external .lud from filepath.
    if (bestMatchFilepath === null) {
      return null;
    }

    // @java resourceStr = bestMatchFilepath.replaceAll(Pattern.quote("\\"), "/")
    let resourceStr = bestMatchFilepath.replace(/\\/g, '/');
    // @java resourceStr = resourceStr.substring(resourceStr.indexOf("/lud/"))
    resourceStr = resourceStr.substring(resourceStr.indexOf('/lud/'));

    return resourceStr;
  }

  // -------------------------------------------------------------------------

  /**
   * To compile the game of an instance of a match.
   *
   * @param instance
   * @java GameLoader#compileInstance(Subgame instance)
   */
  static compileInstance(instance: ISubgame): void {
    // @java final ArrayList<String> option = new ArrayList<String>();
    const option: string[] = [];
    if (instance.optionName() !== null) {
      option.push(instance.optionName()!);
    }

    instance.setGame(
      GameLoader.loadGameFromName(instance.gameName() + '.lud', option)
    );

    if (instance.optionName() !== null) {
      // @java final GameOptions instanceObjectOptions = new GameOptions();
      // In the Java source this builds a GameOptions object but never assigns
      // it anywhere (the variable is local and the method ends). The code is
      // faithfully preserved here as a no-op comment to match Java behaviour.
      // @java: final GameOptions instanceObjectOptions = new GameOptions();
      // @java: final Option optionInstance = new Option();
      // @java: final List<String> headings = new ArrayList<String>();
      // @java: headings.add(instance.optionName());
      // @java: optionInstance.setHeadings(headings);
      // @java: final List<Option>[] optionsAvailable = new ArrayList[1];
      // @java: final ArrayList<Option> optionList = new ArrayList<Option>();
      // @java: optionList.add(optionInstance);
      // @java: optionsAvailable[0] = optionList;
      // @java: instanceObjectOptions.setOptionCategories(optionsAvailable);
      // (result is unused — faithful no-op)
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @return All the analysis game+ruleset name pairs.
   * @java GameLoader#allAnalysisGameRulesetNames()
   */
  static allAnalysisGameRulesetNames(): string[][] {
    if (GameLoader.fileHandling === null) {
      throw new Error(
        'GameLoader.allAnalysisGameRulesetNames: GameLoader.fileHandling must be set.'
      );
    }

    // @java final List<String[]> allGameRulesetNames = new ArrayList<>();
    const allGameRulesetNames: string[][] = [];
    // @java final String[] choices = FileHandling.listGames();
    const choices = GameLoader.fileHandling.listGames();

    for (const s of choices) {
      // @java if (!FileHandling.shouldIgnoreLudAnalysis(s))
      if (!GameLoader.fileHandling.shouldIgnoreLudAnalysis(s)) {
        const tempGame = GameLoader.loadGameFromName(s);
        const rulesets = tempGame.description().rulesets();
        if (rulesets !== null && rulesets.length > 0) {
          for (let rs = 0; rs < rulesets.length; rs++) {
            if (rulesets[rs]!.optionSettings().length > 0) {
              allGameRulesetNames.push([s, rulesets[rs]!.heading()]);
            }
          }
        } else {
          allGameRulesetNames.push([s, '']);
        }
      }
    }

    return allGameRulesetNames;
  }

  // -------------------------------------------------------------------------
}

// @java Mining/src/utils/features/ExportFeaturesDB.java

/**
 * Code to export CSV files for features to database.
 *
 * @java utils/features/ExportFeaturesDB.java
 * @author Dennis Soemers
 */

// Not-yet-ported dependencies — escape-hatch interfaces
type RulesetLike = { optionSettings: () => string[]; heading: () => string };
type OptionLike = { menuHeadings: () => string[] };
type OptionCategoryLike = { options: () => OptionLike[] };
type GameOptionsLike = {
  numCategories: () => number;
  categories: () => OptionCategoryLike[];
  allOptionStrings: (opts: string[]) => string[];
};
type GameDescriptionLike = {
  rulesets: () => RulesetLike[] | null;
  gameOptions: () => GameOptionsLike;
};
type GameLike = {
  name: () => string;
  description: () => GameDescriptionLike;
  players: () => { count: () => number };
};
type GameLoaderLike = { loadGameFromName: (name: string, ...opts: unknown[]) => GameLike };
type FileHandlingLike = { listGames: () => string[] };
type StringRoutinesLike = {
  cleanGameName: (s: string) => string;
  join: (sep: string, arr: string[]) => string;
  quote: (s: string) => string;
};
type ListUtilsLike = {
  generateTuples: (cats: string[][]) => string[][];
};
type CommandLineArgParseLike = {
  getValueString: (name: string) => string;
  parseArguments: (args: string[]) => boolean;
  addOption: (opt: unknown) => void;
};
type PrintWriterLike = {
  println: (s: string) => void;
  close: () => void;
};

/** @java ExportFeaturesDB.GAME_RULESET_PATH */
const GAME_RULESET_PATH = "/concepts/input/GameRulesets.csv";

/** @java ExportFeaturesDB.FEATURES_CSV_PATH */
const FEATURES_CSV_PATH = "/features/Features.csv";

/** @java ExportFeaturesDB.CROSS_ENTROPY_ID */
const CROSS_ENTROPY_ID = 1;

/** @java ExportFeaturesDB.TSPG_ID */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TSPG_ID = 2;

/** @java ExportFeaturesDB */
export class ExportFeaturesDB {
  /**
   * No need to instantiate.
   * @java ExportFeaturesDB()
   */
  private constructor() {
    // no-op
  }

  //-------------------------------------------------------------------------

  /**
   * Export the CSVs.
   *
   * @java ExportFeaturesDB.exportCSVs(CommandLineArgParse)
   */
  private static exportCSVs(argParse: CommandLineArgParseLike): void {
    const FS = (globalThis as unknown as {
      FS: {
        readFileSync: (p: string, enc: string) => string;
        writeFileSync: (p: string, d: string) => void;
        mkdirSync: (p: string, opts?: unknown) => void;
        existsSync: (p: string) => boolean;
        readdirSync: (p: string, opts?: unknown) => Array<{ name: string; isDirectory: () => boolean }>;
        readFileLines: (p: string) => string[];
      }
    }).FS;

    const fileHandling = (globalThis as unknown as { FileHandling: FileHandlingLike }).FileHandling;
    const gameLoader = (globalThis as unknown as { GameLoader: GameLoaderLike }).GameLoader;
    const stringRoutines = (globalThis as unknown as { StringRoutines: StringRoutinesLike }).StringRoutines;
    const ListUtils = (globalThis as unknown as { ListUtils: ListUtilsLike }).ListUtils;

    const allGameNames: string[] = fileHandling.listGames();
    const games: string[] = [];
    const rulesets: string[] = [];
    const ids: number[] = [];

    // Read game-ruleset CSV
    try {
      const content = FS.readFileSync(GAME_RULESET_PATH, "utf-8");
      const lines = content.split("\n");
      for (let lineStr of lines) {
        if (!lineStr.trim()) continue;
        lineStr = lineStr.replace(/"/g, "");
        let separatorIndex = lineStr.indexOf(",");
        const gameName = lineStr.substring(0, separatorIndex);
        games.push(gameName);
        lineStr = lineStr.substring(gameName.length + 1);
        separatorIndex = lineStr.indexOf(",");
        const rulesetName = lineStr.substring(0, separatorIndex);
        rulesets.push(rulesetName);
        lineStr = lineStr.substring(rulesetName.length + 1);
        const id = parseInt(lineStr, 10);
        ids.push(id);
      }
    } catch (e) {
      console.error(e);
    }

    const featureIDsMap = new Map<string, number>();
    const featureStrings: string[] = [];

    // First collect all the already-known features and their IDs
    try {
      const content = FS.readFileSync(FEATURES_CSV_PATH, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        const split = line.split(",");
        const featureID = parseInt(split[0] ?? "", 10);
        const featureString = split[1] ?? "";

        if (featureIDsMap.has(featureString)) {
          if (featureIDsMap.get(featureString) !== featureID) {
            console.error("ERROR: feature ID mismatch!");
          }
          console.error("ERROR: duplicate feature in old CSV");
        } else {
          featureIDsMap.set(featureString, featureID);
          featureStrings.push(featureString);
        }
      }
    } catch (e) {
      console.error(e);
    }

    const outDirPath = argParse.getValueString("--out-dir");
    FS.mkdirSync(outDirPath, { recursive: true });

    const featuresLines: string[] = [];
    const rulesetFeaturesLines: string[] = [];

    // First re-write the features we already know about
    for (let i = 0; i < featureStrings.length; ++i) {
      featuresLines.push((i + 1) + "," + stringRoutines.quote(featureStrings[i]!));
    }

    // Start processing training results
    const gamesDirPath = argParse.getValueString("--games-dir");
    const gameDirs = FS.readdirSync(gamesDirPath, { withFileTypes: true });

    // First counter is Feature ID, second counter is Ruleset-Feature-ID
    const idCounters: [number, number] = [featureStrings.length + 1, 1];

    for (const gameDir of gameDirs) {
      if (!gameDir.isDirectory()) continue;

      // We will either directly find features here, or subdirectories of combinations of options
      const gameDirPath = gamesDirPath + "/" + gameDir.name;
      const files = FS.readdirSync(gameDirPath, { withFileTypes: true });

      if (files.length === 0) continue;

      if (files[0]!.isDirectory()) {
        // Subdirectories for combinations of options
        for (const optionsCombDir of files) {
          if (!optionsCombDir.isDirectory()) continue;
          console.log("Processing: " + gameDir.name + "/" + optionsCombDir.name);
          const optFiles = FS.readdirSync(gameDirPath + "/" + optionsCombDir.name, { withFileTypes: true });
          ExportFeaturesDB.processTrainingResultsDir(
            gameDir.name,
            optionsCombDir.name,
            optFiles.map(f => ({ name: (gameDirPath + "/" + optionsCombDir.name + "/" + f.name), isDirectory: f.isDirectory.bind(f) })),
            featureIDsMap,
            allGameNames,
            games,
            ids,
            rulesets,
            featuresLines,
            rulesetFeaturesLines,
            idCounters,
            gameLoader,
            stringRoutines,
            ListUtils,
            FS
          );
        }
      } else {
        // Just a game-wide directory
        console.log("Processing: " + gameDir.name);
        ExportFeaturesDB.processTrainingResultsDir(
          gameDir.name,
          null,
          files.map(f => ({ name: gameDirPath + "/" + f.name, isDirectory: f.isDirectory.bind(f) })),
          featureIDsMap,
          allGameNames,
          games,
          ids,
          rulesets,
          featuresLines,
          rulesetFeaturesLines,
          idCounters,
          gameLoader,
          stringRoutines,
          ListUtils,
          FS
        );
      }
    }

    FS.writeFileSync(outDirPath + "/Features.csv", featuresLines.join("\n") + "\n");
    FS.writeFileSync(outDirPath + "/RulesetFeatures.csv", rulesetFeaturesLines.join("\n") + "\n");
  }

  //-------------------------------------------------------------------------

  /** @java ExportFeaturesDB.processTrainingResultsDir(...) */
  private static processTrainingResultsDir(
    gameDirName: string,
    optionsCombDirName: string | null,
    trainingOutFiles: Array<{ name: string; isDirectory: () => boolean }>,
    knownFeaturesMap: Map<string, number>,
    allGameNames: string[],
    gameNames: string[],
    ids: number[],
    rulesetNames: string[],
    featuresLines: string[],
    rulesetFeaturesLines: string[],
    idCounters: [number, number],
    gameLoader: GameLoaderLike,
    stringRoutines: StringRoutinesLike,
    ListUtils: ListUtilsLike,
    FS: { readFileSync: (p: string, enc: string) => string }
  ): void {
    // First figure out the proper name of the game we're dealing with
    let gameName = "";

    for (const name of allGameNames) {
      const gameNameSplit = name.replace(/\\/g, "/").split("/");
      const cleanGameName = stringRoutines.cleanGameName(gameNameSplit[gameNameSplit.length - 1] ?? "");
      if (gameDirName === cleanGameName) {
        gameName = name;
        break;
      }
    }

    if (gameName === "") {
      console.error("Can't recognise game: " + gameDirName);
      return;
    }

    // Compile game without options
    const gameDefault: GameLike = gameLoader.loadGameFromName(gameName);

    let optionsToCompile: string[] | null = null;
    if (optionsCombDirName === null) {
      optionsToCompile = [];
    } else {
      // Figure out all combinations of options
      const optionCategories: string[][] = [];

      for (let o = 0; o < gameDefault.description().gameOptions().numCategories(); o++) {
        const options = gameDefault.description().gameOptions().categories()[o]!.options();
        const optionCategory: string[] = [];

        for (let i = 0; i < options.length; i++) {
          const option = options[i]!;
          const categoryStr = stringRoutines.join("/", option.menuHeadings());

          if (
            !categoryStr.includes("Board Size/") &&
            !categoryStr.includes("Rows/") &&
            !categoryStr.includes("Columns/")
          ) {
            optionCategory.push(categoryStr);
          }
        }

        if (optionCategory.length > 0) {
          optionCategories.push(optionCategory);
        }
      }

      const optionCombinations: string[][] = ListUtils.generateTuples(optionCategories);

      // Figure out which combination of options is the correct one
      for (const optionCombination of optionCombinations) {
        const optionCombinationString =
          stringRoutines.join("-", optionCombination)
            .replace(/ /g, "")
            .replace(/\//g, "_")
            .replace(/\(/g, "_")
            .replace(/\)/g, "_")
            .replace(/,/g, "_");

        if (optionsCombDirName === optionCombinationString) {
          optionsToCompile = optionCombination;
          break;
        }
      }

      if (optionsToCompile === null) {
        console.error("Couldn't find options to compile!");
        return;
      }
    }

    // See if we can find a ruleset that matches our list of options to compile with
    const rulesetsInGame: RulesetLike[] | null = gameDefault.description().rulesets();
    let rulesetID = -1;
    if (rulesetsInGame !== null && rulesetsInGame.length > 0) {
      const specifiedOptions =
        gameDefault.description().gameOptions().allOptionStrings(optionsToCompile);

      for (let rs = 0; rs < rulesetsInGame.length; rs++) {
        const ruleset = rulesetsInGame[rs]!;
        if (ruleset.optionSettings().length > 0) {
          const rulesetOptions =
            gameDefault.description().gameOptions().allOptionStrings(ruleset.optionSettings());

          if (JSON.stringify(rulesetOptions) === JSON.stringify(specifiedOptions)) {
            const rulesetHeading = ruleset.heading();
            const startString = "Ruleset/";
            const rulesetNameCSV = rulesetHeading.substring(
              startString.length,
              rulesetHeading.lastIndexOf("(") - 1
            );

            for (let i = 0; i < gameNames.length; i++) {
              if (gameNames[i] === gameDefault.name() && rulesetNames[i] === rulesetNameCSV) {
                rulesetID = ids[i] ?? -1;
                break;
              }
            }

            if (rulesetID !== -1) break;
          }
        }
      }
    } else {
      // No rulesets; see if these options are just the default for the game
      const defaultOptions =
        gameDefault.description().gameOptions().allOptionStrings([]);
      const specifiedOptions =
        gameDefault.description().gameOptions().allOptionStrings(optionsToCompile);

      if (JSON.stringify(defaultOptions) === JSON.stringify(specifiedOptions)) {
        for (let i = 0; i < gameNames.length; i++) {
          if (gameNames[i] === gameDefault.name()) {
            rulesetID = ids[i] ?? -1;
            break;
          }
        }
      } else {
        // We're skipping these options, they're not the default
        return;
      }
    }

    if (rulesetID === -1) return; // Didn't find matching ruleset

    const game: GameLike = gameLoader.loadGameFromName(gameName, optionsToCompile);
    const numPlayers = game.players().count();

    // Find latest FeatureSet and PolicyWeightsCE files per player
    const latestFeatureSetFiles: (string | null)[] = new Array(numPlayers + 1).fill(null);
    const latestPolicyWeightFiles: (string | null)[] = new Array(numPlayers + 1).fill(null);
    const latestCheckpoints: number[] = new Array(numPlayers + 1).fill(-1);

    for (const trainingOutFile of trainingOutFiles) {
      const outFilename = trainingOutFile.name.split("/").pop() ?? "";
      if (!outFilename.startsWith("FeatureSet_")) continue;

      // We're dealing with a featureset file
      const outFilenameSplit = outFilename.split("_");
      const player = parseInt((outFilenameSplit[1] ?? "0").substring(1), 10);
      const checkpointStr = (outFilenameSplit[2] ?? "").replace(".fs", "");
      const checkpoint = parseInt(checkpointStr, 10);

      if (checkpoint > (latestCheckpoints[player] ?? -1)) {
        // New latest checkpoint
        latestCheckpoints[player] = checkpoint;
        latestFeatureSetFiles[player] = trainingOutFile.name;

        // Find matching CE weights file
        const dir = trainingOutFile.name.substring(0, trainingOutFile.name.lastIndexOf("/"));
        latestPolicyWeightFiles[player] = dir + "/PolicyWeightsCE_P" + player + "_" + checkpointStr + ".txt";
      }
    }

    for (let p = 1; p <= numPlayers; ++p) {
      if (latestFeatureSetFiles[p] !== null) {
        // Read the list of feature strings
        const features: string[] = [];
        try {
          const content = FS.readFileSync(latestFeatureSetFiles[p]!, "utf-8");
          for (const line of content.split("\n")) {
            if (line.length > 0) features.push(line);
          }
        } catch (e) {
          console.error(e);
        }

        // Read the list of feature weights
        const weights: number[] = [];
        try {
          const content = FS.readFileSync(latestPolicyWeightFiles[p]!, "utf-8");
          for (const line of content.split("\n")) {
            if (line.startsWith("FeatureSet=")) break;
            if (line.trim().length > 0) weights.push(parseFloat(line));
          }
        } catch (e) {
          console.error(e);
        }

        // Write results to CSVs
        for (let i = 0; i < features.length; ++i) {
          const feature = features[i] ?? "";
          const weight = weights[i] ?? 0;
          let featureID: number;

          if (!knownFeaturesMap.has(feature)) {
            featureID = idCounters[0]++;
            knownFeaturesMap.set(feature, featureID);
            featuresLines.push(featureID + "," + stringRoutines.quote(feature));
          } else {
            featureID = knownFeaturesMap.get(feature)!;
          }

          rulesetFeaturesLines.push(
            [
              String(idCounters[1]++),
              String(rulesetID),
              String(featureID),
              String(CROSS_ENTROPY_ID),
              String(p),
              String(weight),
            ].join(",")
          );
        }
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Main method.
   *
   * @java ExportFeaturesDB.main(String[])
   */
  public static main(args: string[]): void {
    const CommandLineArgParse = (globalThis as unknown as {
      CommandLineArgParse: new (failOnUnrecognised: boolean, desc: string) => CommandLineArgParseLike
    }).CommandLineArgParse;

    // Define options for arg parser
    const argParse = new CommandLineArgParse(true, "Export CSVs for features in database.");

    const ArgOption = (globalThis as unknown as { ArgOption: new () => unknown }).ArgOption;
    const OptionTypes = (globalThis as unknown as { OptionTypes: { String: string } }).OptionTypes;

    argParse.addOption(
      (new ArgOption() as unknown as {
        withNames: (n: string) => unknown;
        help: (h: string) => unknown;
        withNumVals: (n: number) => unknown;
        withType: (t: string) => unknown;
        setRequired: () => unknown;
      })
        .withNames("--games-dir")
        // We just chain and ignore — the actual object is passed directly
    );
    argParse.addOption(
      (new ArgOption() as unknown as {
        withNames: (n: string) => unknown;
        help: (h: string) => unknown;
        withNumVals: (n: number) => unknown;
        withType: (t: string) => unknown;
        setRequired: () => unknown;
      })
        .withNames("--out-dir")
    );

    // Parse the args
    if (!argParse.parseArguments(args)) return;

    ExportFeaturesDB.exportCSVs(argParse);
  }

  //-------------------------------------------------------------------------
}

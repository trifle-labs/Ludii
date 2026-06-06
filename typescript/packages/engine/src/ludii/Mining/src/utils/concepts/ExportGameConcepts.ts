// @java Mining/src/utils/concepts/ExportGameConcepts.java

/**
 * Method to create the csv files listing all the game concepts used by each
 * game.
 *
 * @java utils/concepts/ExportGameConcepts.java
 * @author Eric Piette
 */

// Not-yet-ported dependency escape-hatch interfaces
type FileHandlingLike = {
  listGames: () => string[];
  shouldIgnoreLudAnalysis: (name: string) => boolean;
};
type StringRoutinesLike = { join: (sep: string, parts: string[]) => string };
type RulesetLike = { optionSettings: () => string[]; heading: () => string };
type GameDescriptionLike = { rulesets: () => RulesetLike[] | null };
type GameLike = {
  name: () => string;
  description: () => GameDescriptionLike;
  booleanConcepts: () => BitSetLike;
  nonBooleanConcepts: () => Map<number, string>;
};
type BitSetLike = { get: (id: number) => boolean };
type GameLoaderLike = {
  loadGameFromName: (name: string, opts?: string[] | string) => GameLike;
};
type ConceptLike = {
  id: () => number;
  name: () => string;
  dataType: () => ConceptDataTypeLike;
};
type ConceptDataTypeLike = { equals: (other: ConceptDataTypeLike) => boolean };
type DBGameInfoLike = { getUniqueName: (game: GameLike) => string };

/** @java ExportGameConcepts.DOCUMENTED_DLP_LIST_PATH */
const DOCUMENTED_DLP_LIST_PATH: string = "res/concepts/input/documentedRulesets.csv";

/** @java ExportGameConcepts.DLP_LIST_PATH */
const DLP_LIST_PATH: string = "res/concepts/input/dlpRulesets.csv";

// CSV to export
/** @java ExportGameConcepts.noHumanCSV */
const noHumanCSV: string[] = [];
/** @java ExportGameConcepts.humanCSV */
const humanCSV: string[] = [];
/** @java ExportGameConcepts.noHumanDocumentedDLPCSV */
const noHumanDocumentedDLPCSV: string[] = [];
/** @java ExportGameConcepts.noHumanDLPCSV */
const noHumanDLPCSV: string[] = [];
/** @java ExportGameConcepts.noHumanNotDLPCSV */
const noHumanNotDLPCSV: string[] = [];

// DLP data
/** @java ExportGameConcepts.documentedDLPGames */
const documentedDLPGames: string[] = [];
/** @java ExportGameConcepts.documentedDLPRulesets */
const documentedDLPRulesets: string[][] = [];
/** @java ExportGameConcepts.DLPGames */
const DLPGames: string[] = [];
/** @java ExportGameConcepts.DLPRulesets */
const DLPRulesets: string[][] = [];

/** @java ExportGameConcepts */
export class ExportGameConcepts {

  /**
   * Main method.
   * @java ExportGameConcepts.main(String[])
   */
  public static main(_args: string[]): void {
    const fileHandling = (globalThis as unknown as { FileHandling: FileHandlingLike }).FileHandling;
    const stringRoutines = (globalThis as unknown as { StringRoutines: StringRoutinesLike }).StringRoutines;
    const gameLoader = (globalThis as unknown as { GameLoader: GameLoaderLike }).GameLoader;
    const Concept = (globalThis as unknown as { Concept: { values: () => ConceptLike[] } }).Concept;
    const ConceptDataType = (globalThis as unknown as {
      ConceptDataType: { BooleanData: ConceptDataTypeLike };
    }).ConceptDataType;

    // Get the DLP data.
    ExportGameConcepts.getDocumentedDLPRulesets();
    ExportGameConcepts.getDLPRulesets();

    // Compilation of all the games.
    const allGameNames: string[] = fileHandling.listGames();
    for (let index = 0; index < allGameNames.length; index++) {
      const gameName: string = allGameNames[index]!;
      if (fileHandling.shouldIgnoreLudAnalysis(gameName))
        continue;

      console.log("Compilation of : " + gameName);
      const game: GameLike = gameLoader.loadGameFromName(gameName);

      ExportGameConcepts.exportFor(false, false, false, false, game, gameName); // Non Human, non DLP.
      ExportGameConcepts.exportFor(true, false, false, false, game, gameName); // Human, non DLP.
      ExportGameConcepts.exportFor(false, true, false, false, game, gameName); // Non Human, only documented DLP rulesets.
      ExportGameConcepts.exportFor(false, false, true, false, game, gameName); // Non Human, only DLP games.
      ExportGameConcepts.exportFor(false, false, false, true, game, gameName); // Non Human, only non DLP games.
    }

    // for Human CSV: We write the row to count the concepts on.
    const flagsCount: number[] = [];
    const firstRowSplit: string[] = humanCSV[0]!.split(",");
    for (let i = 0; i < firstRowSplit.length - 2; i++)
      flagsCount.push(0);
    for (let i = 1; i < humanCSV.length; i++) {
      const humanString: string = humanCSV[i]!;
      const splitString: string[] = humanString.split(",");
      for (let j = 2; j < splitString.length; j++)
        if (splitString[j] !== "")
          flagsCount[j - 2] = (flagsCount[j - 2] ?? 0) + 1;
    }
    let stringToWrite: string = "Num Concepts,";
    stringToWrite += ",";
    for (let j = 0; j < flagsCount.length; j++)
      stringToWrite += flagsCount[j] + ",";
    stringToWrite = stringToWrite.substring(0, stringToWrite.length - 1);
    humanCSV.splice(1, 0, stringToWrite);

    // for Human CSV: remove the column with concepts never used.
    const columnToRemove: number[] = [];
    const countConcepts: string[] = humanCSV[1]!.split(",");
    for (let i = 0; i < countConcepts.length; i++)
      if (countConcepts[i] === "0")
        columnToRemove.push(i);
    for (let i = 0; i < humanCSV.length; i++) {
      const stringSplit: string[] = humanCSV[i]!.split(",");
      const newStringSplit: string[] = [];
      for (let j = 0; j < stringSplit.length; j++)
        if (!columnToRemove.includes(j)) {
          newStringSplit.push(stringSplit[j]!);
        }
      humanCSV[i] = stringRoutines.join(",", newStringSplit);
    }

    const writeFile = (globalThis as unknown as { writeFile: (path: string, lines: string[]) => void }).writeFile;

    const fileNameNoHuman: string = "LudiiGameConcepts";
    const outputFilePathNoHuman: string = "./res/concepts/output/" + fileNameNoHuman + ".csv";
    writeFile(outputFilePathNoHuman, noHumanCSV.map((s) => stringRoutines.join(",", [s])));

    const fileNameHuman: string = "LudiiGameConceptsHUMAN";
    const outputFilePathHuman: string = "./res/concepts/output/" + fileNameHuman + ".csv";
    writeFile(outputFilePathHuman, humanCSV.map((s) => stringRoutines.join(",", [s])));

    const fileNameNoHumanDocumentedDLP: string = "LudiiGameConceptsDocumentedDLP";
    const outputFilePathNoHumanDocumentedDLP: string = "./res/concepts/output/" + fileNameNoHumanDocumentedDLP + ".csv";
    writeFile(outputFilePathNoHumanDocumentedDLP, noHumanDocumentedDLPCSV.map((s) => stringRoutines.join(",", [s])));

    const fileNameNoHumanDLP: string = "LudiiGameConceptsDLP";
    const outputFilePathNoHumanDLP: string = "./res/concepts/output/" + fileNameNoHumanDLP + ".csv";
    writeFile(outputFilePathNoHumanDLP, noHumanDLPCSV.map((s) => stringRoutines.join(",", [s])));

    const fileNameNoHumanNotDLP: string = "LudiiGameConceptsNonDLP";
    const outputFilePathNoHumanNotDLP: string = "./res/concepts/output/" + fileNameNoHumanNotDLP + ".csv";
    writeFile(outputFilePathNoHumanNotDLP, noHumanNotDLPCSV.map((s) => stringRoutines.join(",", [s])));
  }

  /**
   * To run the code according to human or DLP.
   * @java ExportGameConcepts.exportFor(boolean, boolean, boolean, boolean, Game, String)
   */
  public static exportFor(
    HUMAN_VERSION: boolean,
    DOCUMENTED_DLP: boolean,
    DLP: boolean,
    NonDLP: boolean,
    game: GameLike,
    gameName: string
  ): void {
    const stringRoutines = (globalThis as unknown as { StringRoutines: StringRoutinesLike }).StringRoutines;
    const gameLoader = (globalThis as unknown as { GameLoader: GameLoaderLike }).GameLoader;
    const Concept = (globalThis as unknown as { Concept: { values: () => ConceptLike[] } }).Concept;
    const ConceptDataType = (globalThis as unknown as {
      ConceptDataType: { BooleanData: ConceptDataTypeLike };
    }).ConceptDataType;
    const DBGameInfo = (globalThis as unknown as { DBGameInfo: DBGameInfoLike }).DBGameInfo;

    const booleanConceptsID: number[] = [];
    const nonBooleanConceptsID: number[] = [];

    // We create the header row.
    const headers: string[] = [];
    headers.push("Game Name");
    if (HUMAN_VERSION)
      headers.push("Num Flags On");

    // We get the boolean concepts.
    for (const concept of Concept.values())
      if (concept.dataType().equals(ConceptDataType.BooleanData)) {
        booleanConceptsID.push(concept.id());
        headers.push(concept.name());
      }

    for (const concept of Concept.values())
      if (!concept.dataType().equals(ConceptDataType.BooleanData)) {
        headers.push(concept.name());
        nonBooleanConceptsID.push(concept.id());
      }

    // In human version we count the game with a flag on.
    const countGamesFlagOn: number[] = [];
    for (let i = 0; i < booleanConceptsID.length; i++)
      countGamesFlagOn.push(0);

    const booleanConceptsOn: string[][] = [];

    // Some filters in case of DLP games.
    if (DOCUMENTED_DLP && !documentedDLPGames.includes(game.name()))
      return;

    if (DLP && !DLPGames.includes(game.name()))
      return;

    if (NonDLP && DLPGames.includes(game.name()))
      return;

    // We got the games (with rulesets) to look at.
    const rulesetsToLook: GameLike[] = [];
    const rulesetNamesToLook: string[] = [];

    const rulesets: RulesetLike[] | null = game.description().rulesets();
    if (rulesets !== null && rulesets.length > 0) {
      for (let rs = 0; rs < rulesets.length; rs++) {
        const ruleset: RulesetLike = rulesets[rs]!;

        if (ruleset.optionSettings().length > 0) {
          const startString: string = "Ruleset/";
          const name_ruleset_csv: string = ruleset.heading().substring(
            startString.length,
            ruleset.heading().lastIndexOf("(") - 1
          );

          const rulesetGame: GameLike = gameLoader.loadGameFromName(gameName, ruleset.optionSettings());
          const name_ruleset: string = ruleset.heading();
          console.log("Compilation of " + rulesetGame.name() + " RULESET = " + name_ruleset);

          if (DOCUMENTED_DLP || DLP) {
            let found: boolean = false;
            const sourceList: string[][] = DOCUMENTED_DLP ? documentedDLPRulesets : DLPRulesets;
            for (const list of sourceList) {
              if (list[0] === game.name()) {
                for (let i = 1; i < list.length; i++) {
                  if (name_ruleset_csv === list[i]) {
                    rulesetsToLook.push(rulesetGame);
                    rulesetNamesToLook.push(DBGameInfo.getUniqueName(rulesetGame));
                    found = true;
                    break;
                  }
                }
              }
              if (found)
                break;
            }
          } else {
            rulesetsToLook.push(rulesetGame);
            rulesetNamesToLook.push(DBGameInfo.getUniqueName(rulesetGame));
          }
        }
      }
    } else {
      if (DOCUMENTED_DLP || DLP) {
        const sourceList: string[][] = DOCUMENTED_DLP ? documentedDLPRulesets : DLPRulesets;
        for (const list of sourceList) {
          if (list[0] === game.name()) { // 0 because only one ruleset
            rulesetsToLook.push(game);
            rulesetNamesToLook.push(DBGameInfo.getUniqueName(game));
            break;
          }
        }
      } else {
        rulesetsToLook.push(game);
        rulesetNamesToLook.push(DBGameInfo.getUniqueName(game));
      }
    }

    // We get the concepts of each game.
    for (let indexGamesToLook = 0; indexGamesToLook < rulesetsToLook.length; indexGamesToLook++) {
      const game_ruleset: GameLike = rulesetsToLook[indexGamesToLook]!;
      const game_ruleset_name: string = rulesetNamesToLook[indexGamesToLook]!;
      const flagsOn: string[] = [];
      flagsOn.push(game_ruleset_name.replace(/'/g, "").replace(/,/g, ""));
      let count: number = 0;
      for (let i = 0; i < booleanConceptsID.length; i++) {
        if (game_ruleset.booleanConcepts().get(booleanConceptsID[i]!)) {
          flagsOn.push(HUMAN_VERSION ? "Yes" : "1");
          count++;
          countGamesFlagOn[i] = (countGamesFlagOn[i] ?? 0) + 1;
        } else {
          flagsOn.push(HUMAN_VERSION ? "" : "0");
        }
      }

      // if human version we add a column for the count of the flags on in the second one.
      if (HUMAN_VERSION) {
        flagsOn.push("");
        for (let j = flagsOn.length - 1; j > 1; j--)
          flagsOn[j] = flagsOn[j - 1]!;
        flagsOn[1] = count + "";
      }

      // We export the non boolean concepts.
      for (let i = 0; i < nonBooleanConceptsID.length; i++) {
        const idConcept: number = nonBooleanConceptsID[i]!;
        flagsOn.push(game_ruleset.nonBooleanConcepts().get(idConcept) ?? "");
      }

      booleanConceptsOn.push(flagsOn);
    }

    if (!HUMAN_VERSION && !DOCUMENTED_DLP && !NonDLP && !DLP && noHumanCSV.length === 0)
      noHumanCSV.push(stringRoutines.join(",", headers));
    else if (HUMAN_VERSION && !DOCUMENTED_DLP && !NonDLP && !DLP && humanCSV.length === 0)
      humanCSV.push(stringRoutines.join(",", headers));
    else if (!HUMAN_VERSION && DOCUMENTED_DLP && !NonDLP && !DLP && noHumanDocumentedDLPCSV.length === 0)
      noHumanDocumentedDLPCSV.push(stringRoutines.join(",", headers));
    else if (!HUMAN_VERSION && DLP && !DOCUMENTED_DLP && !NonDLP && noHumanDLPCSV.length === 0)
      noHumanDLPCSV.push(stringRoutines.join(",", headers));
    else if (!HUMAN_VERSION && !DLP && !DOCUMENTED_DLP && NonDLP && noHumanNotDLPCSV.length === 0)
      noHumanNotDLPCSV.push(stringRoutines.join(",", headers));

    // Write row for each the game.
    for (const flagsOn of booleanConceptsOn) {
      if (!HUMAN_VERSION && !DOCUMENTED_DLP && !DLP && !NonDLP)
        noHumanCSV.push(stringRoutines.join(",", flagsOn));
      else if (HUMAN_VERSION && !DOCUMENTED_DLP && !DLP && !NonDLP)
        humanCSV.push(stringRoutines.join(",", flagsOn));
      else if (!HUMAN_VERSION && DOCUMENTED_DLP && !DLP && !NonDLP)
        noHumanDocumentedDLPCSV.push(stringRoutines.join(",", flagsOn));
      else if (!HUMAN_VERSION && DLP && !DOCUMENTED_DLP && !NonDLP)
        noHumanDLPCSV.push(stringRoutines.join(",", flagsOn));
      else if (!HUMAN_VERSION && !DLP && !DOCUMENTED_DLP && NonDLP)
        noHumanNotDLPCSV.push(stringRoutines.join(",", flagsOn));
    }
  }

  /**
   * To get the documented DLP rulesets.
   * @java ExportGameConcepts.getDocumentedDLPRulesets()
   */
  public static getDocumentedDLPRulesets(): void {
    const fsReadFile = (globalThis as unknown as {
      fsReadFileSync: (path: string, encoding: string) => string;
    }).fsReadFileSync;

    try {
      const content: string = fsReadFile("./" + DOCUMENTED_DLP_LIST_PATH, "utf-8");
      const lines: string[] = content.split("\n");
      for (const line of lines) {
        if (line.trim().length === 0) continue;
        const name: string = line.substring(1, line.length - 1);
        const separatorIndex: number = name.indexOf(",");
        const game_ruleset: string =
          name.substring(0, separatorIndex - 1) + "_" + name.substring(separatorIndex + 2, name.length);
        const game_name: string = game_ruleset.substring(0, game_ruleset.indexOf("_"));
        const ruleset_name: string = game_ruleset.substring(game_ruleset.indexOf("_") + 1, game_ruleset.length);
        documentedDLPGames.push(game_name);

        let found: boolean = false;
        for (const list of documentedDLPRulesets) {
          if (list[0] === game_name) {
            found = true;
            list.push(ruleset_name);
            break;
          }
        }
        if (!found) {
          documentedDLPRulesets.push([game_name, ruleset_name]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * To get the documented DLP rulesets.
   * @java ExportGameConcepts.getDLPRulesets()
   */
  public static getDLPRulesets(): void {
    const fsReadFile = (globalThis as unknown as {
      fsReadFileSync: (path: string, encoding: string) => string;
    }).fsReadFileSync;

    try {
      const content: string = fsReadFile("./" + DLP_LIST_PATH, "utf-8");
      const lines: string[] = content.split("\n");
      for (const line of lines) {
        if (line.trim().length === 0) continue;
        const name: string = line.substring(1, line.length - 1);
        const separatorIndex: number = name.indexOf(",");
        const game_ruleset: string =
          name.substring(0, separatorIndex - 1) + "_" + name.substring(separatorIndex + 2, name.length);
        const game_name: string = game_ruleset.substring(0, game_ruleset.indexOf("_"));
        const ruleset_name: string = game_ruleset.substring(game_ruleset.indexOf("_") + 1, game_ruleset.length);
        DLPGames.push(game_name);

        let found: boolean = false;
        for (const list of DLPRulesets) {
          if (list[0] === game_name) {
            found = true;
            list.push(ruleset_name);
            break;
          }
        }
        if (!found) {
          DLPRulesets.push([game_name, ruleset_name]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}

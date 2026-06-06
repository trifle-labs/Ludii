// @java Mining/src/utils/concepts/db/ExportDbCsvConcepts.java

import * as fs from "fs";
import * as path from "path";
import { Concept, conceptId, conceptType, conceptDataType, conceptComputationType, conceptPurposes, conceptIsLeaf, conceptDescription, conceptTaxonomy } from "../../../../../../ludemes/other/concept/Concept.js";
import { ConceptType } from "../../../../../../ludemes/other/concept/ConceptType.js";
import { ConceptDataType, conceptDataTypeId } from "../../../../../../ludemes/other/concept/ConceptDataType.js";
import { ConceptComputationType, conceptComputationTypeId } from "../../../../../../ludemes/other/concept/ConceptComputationType.js";
import { ConceptPurpose, conceptPurposeId } from "../../../../../../ludemes/other/concept/ConceptPurpose.js";
import { conceptTypeId } from "../../../../../../ludemes/other/concept/ConceptType.js";
import { StringRoutines } from "../../../../../Common/src/main/StringRoutines.js";
import { FileHandling } from "../../../../../Common/src/main/FileHandling.js";
import { UnixPrintWriter } from "../../../../../Common/src/main/UnixPrintWriter.js";
import { GameLoader, type IRuleset } from "../../../../../../ludemes/other/GameLoader.js";
import { IdRuleset } from "../../IdRuleset.js";
import { Evaluation } from "../../../../../Evaluation/src/metrics/Evaluation.js";

/**
 * To export the necessary CSV to build the tables in the database for the concepts.
 *
 * @java utils.concepts.db.ExportDbCsvConcepts
 * @author Eric.Piette
 *
 *         Structure for the db:
 *
 *         Concepts.csv (Id, Name, Description, TypeId, DataTypeId, ComputationTypeId)
 *         ConceptTypes.csv (Id, Name)
 *         ConceptDataTypes.csv (Id, Name)
 *         ConceptComputationTypes.csv (Id, Name)
 *         ConceptKeywords.csv (Id, Name, Description)
 *         ConceptPurposes.csv (Id, Name)
 *         ConceptConceptKeywords.csv (Id, ConceptId, KeywordId)
 *         ConceptConceptPurposes.csv (Id, ConceptId, PurposeId)
 *         RulesetConcepts.csv (Id, RulesetId, ConceptId, Value)
 */

// Not-yet-ported dependency escape-hatch interfaces
type RandomProviderStateLike = unknown;
type TrialLike = {
  over: () => boolean;
  numMoves: () => number;
  numInitialPlacementMoves: () => number;
  getMove: (i: number) => MoveLike;
  lastMove: () => MoveLike;
};
type ContextLike = {
  game: () => GameLike;
  trial: () => TrialLike;
  rng: () => { saveState: () => RandomProviderStateLike };
  active: () => boolean;
  containers: () => ContainerLike[];
  containerState: (cid: number) => ContainerStateLike;
  sitesFrom: () => number[];
  rules: () => RulesLike;
  state: () => StateLike;
  model: () => ModelLike;
};

/** Fully standalone GameLike — not extending IGame to avoid missing name(). */
type GameLike = {
  name: () => string;
  getRuleset: () => IRuleset | null;
  description: () => { rulesets: () => IRuleset[] | null };
  hasSubgames: () => boolean;
  instances: () => { getGame: () => GameLike }[];
  setMaxMoveLimit: (limit: number) => void;
  booleanConcepts: () => { get: (id: number) => boolean };
  nonBooleanConcepts: () => Map<number, string>;
  players: () => { count: () => number };
  isStacking: () => boolean;
  start: (ctx: ContextLike) => void;
  playout: (ctx: ContextLike, ais: unknown, time: number, filter: unknown, n1: number, n2: number, rng: unknown) => void;
  moves: (ctx: ContextLike) => { moves: () => MoveLike[]; count: () => number };
  apply: (ctx: ContextLike, move: MoveLike) => void;
};
type MoveLike = {
  moveConcepts: (ctx: ContextLike) => { get: (id: number) => boolean };
  apply: (ctx: ContextLike, arg: boolean) => void;
};
type ContainerLike = {
  topology: () => {
    cells: () => unknown[];
    vertices: () => unknown[];
    edges: () => unknown[];
  };
};
type ContainerStateLike = {
  sizeStack: (site: number, type: unknown) => number;
  count: (site: number, type: unknown) => number;
};
type RulesLike = {
  phases: () => PhaseLike[] | null;
  end: () => EndLike | null;
};
type PhaseLike = { end: () => EndLike | null };
type EndLike = { endRules: () => EndRuleLike[] };
type EndRuleLike = {
  eval: (ctx: ContextLike) => EndRuleLike | null;
  stateConcepts: (ctx: ContextLike) => { get: (id: number) => boolean };
};
type StateLike = {
  mover: () => number;
  currentPhase: (player: number) => number;
};
type ModelLike = {
  startNewStep: (ctx: ContextLike, ais: (AILike | null)[], time: number) => void;
};
type MetricLike = {
  concept: () => Concept | null;
  apply: (game: GameLike, evaluation: EvaluationLike, trials: TrialLike[], rngs: RandomProviderStateLike[]) => number | null;
};
type EvaluationLike = {
  conceptMetrics: () => MetricLike[];
};
type AILike = {
  supportsGame: (game: GameLike) => boolean;
  initAI: (game: GameLike, p: number) => void;
  setMaxSecondsPerMove: (t: number) => void;
  closeAI: () => void;
};
type AIFactoryLike = { createAI: (name: string) => AILike };
type MatchRecordLike = {
  trial: () => TrialLike;
  rngState: () => RandomProviderStateLike;
};

// SiteType enum equivalent — opaque token passed to containerState methods
const SiteTypeCell: unknown = 0;   // ordinal matching Java SiteType.Cell
const SiteTypeVertex: unknown = 1; // ordinal matching Java SiteType.Vertex
const SiteTypeEdge: unknown = 2;   // ordinal matching Java SiteType.Edge

// Java DecimalFormat("##.##") equivalent
function decimalFormat(v: number): string {
  return parseFloat(v.toFixed(2)).toString();
}

// Helper: get all Concept enum values (numeric enum — filter to numbers only)
function allConceptValues(): Concept[] {
  return (Object.values(Concept).filter(v => typeof v === "number") as Concept[]);
}

// Helper: get the string name of a Concept enum member (reverse mapping)
function conceptName(c: Concept): string {
  return Concept[c] as string;
}

//-----------------------------------------------------------------------------

/** @java ExportDbCsvConcepts.GAME_RULESET_PATH */
const GAME_RULESET_PATH = "/concepts/input/GameRulesets.csv";

/** @java ExportDbCsvConcepts.moveLimit */
let moveLimit: number;

/** @java ExportDbCsvConcepts.folderTrials */
let folderTrials: string;

/** @java ExportDbCsvConcepts.trials */
const trials: TrialLike[] = [];

/** @java ExportDbCsvConcepts.allStoredRNG */
const allStoredRNG: RandomProviderStateLike[] = [];

/** @java ExportDbCsvConcepts.lessTrialsGames */
const lessTrialsGames: string[] = [];

/** @java ExportDbCsvConcepts.smallLimitTrials */
const smallLimitTrials = 30;

/** @java ExportDbCsvConcepts.evenLessTrialsGames */
const evenLessTrialsGames: string[] = [];

/** @java ExportDbCsvConcepts.smallestLimitTrials */
const smallestLimitTrials = 1;

/** @java ExportDbCsvConcepts */
export class ExportDbCsvConcepts {

  // -------------------------------------------------------------------------

  /**
   * @java ExportDbCsvConcepts.main(String[])
   */
  public static main(args: string[]): void {
    // Store the games which needs less trials.
    lessTrialsGames.push("Russian Fortress Chess");
    lessTrialsGames.push("Puhulmutu");
    lessTrialsGames.push("Ludus Latrunculorum");
    lessTrialsGames.push("Poprad Game");
    lessTrialsGames.push("Unashogi");
    lessTrialsGames.push("Taikyoku Shogi");
    lessTrialsGames.push("Tai Shogi");
    lessTrialsGames.push("Pagade Kayi Ata (Sixteen-handed)");
    lessTrialsGames.push("Chex");
    lessTrialsGames.push("Poprad Game");
    lessTrialsGames.push("Backgammon"); // Mostly for smart agent (AB), the playouts are too long
    lessTrialsGames.push("Buffa de Baldrac"); // Mostly for smart agent (AB), the playouts are too long
    lessTrialsGames.push("Portes"); // Mostly for smart agent (AB), the playouts are too long
    lessTrialsGames.push("Shatranj al-Kabir"); // Mostly for smart agent (AB), the playouts are too long

    // Really slow games (included deduc puzzles because the trials always reach the move limit....)
    evenLessTrialsGames.push("Kriegsspiel");
    evenLessTrialsGames.push("Anti-Knight Sudoku");
    evenLessTrialsGames.push("Fill A Pix");
    evenLessTrialsGames.push("Futoshiki");
    evenLessTrialsGames.push("Hoshi");
    evenLessTrialsGames.push("Kakuro");
    evenLessTrialsGames.push("Killer Sudoku");
    evenLessTrialsGames.push("Latin Square");
    evenLessTrialsGames.push("Magic Hexagon");
    evenLessTrialsGames.push("Magic Square");
    evenLessTrialsGames.push("N Queens");
    evenLessTrialsGames.push("Samurai Sudoku");
    evenLessTrialsGames.push("Slitherlink");
    evenLessTrialsGames.push("Squaro");
    evenLessTrialsGames.push("Sudoku");
    evenLessTrialsGames.push("Sudoku Mine");
    evenLessTrialsGames.push("Sudoku X");
    evenLessTrialsGames.push("Sujiken");
    evenLessTrialsGames.push("Takuzu");
    evenLessTrialsGames.push("Tridoku");

    const evaluation = new Evaluation() as unknown as EvaluationLike;
    let numPlayouts = args.length === 0 ? 0 : parseInt(args[0]!, 10);
    const timeLimit = args.length < 2 ? 0 : parseFloat(args[1]!);
    const thinkingTime = args.length < 3 ? 1 : parseFloat(args[2]!);
    moveLimit = args.length < 4 ? 1000 /* Constants.DEFAULT_MOVES_LIMIT */ : parseInt(args[3]!, 10);
    const agentName = args.length < 5 ? "Random" : args[4]!;
    folderTrials = args.length < 6 ? "" : args[5]!;
    const gameName = args.length < 7 ? "" : args[6]!;
    const rulesetName = args.length < 8 ? "" : args[7]!;
    const agentName2 = args.length < 9 ? "" : args[8]!;

    if (gameName.length === 0) {
      ExportDbCsvConcepts.exportConceptCSV();
      ExportDbCsvConcepts.exportConceptTypeCSV();
      ExportDbCsvConcepts.exportConceptDataTypeCSV();
      ExportDbCsvConcepts.exportConceptComputationTypeCSV();
      ExportDbCsvConcepts.exportConceptPurposeCSV();
      ExportDbCsvConcepts.exportConceptConceptPurposesCSV();
    }

    if (evenLessTrialsGames.includes(gameName) && numPlayouts > smallestLimitTrials)
      numPlayouts = smallestLimitTrials;
    else if (lessTrialsGames.includes(gameName) && numPlayouts > smallLimitTrials)
      numPlayouts = smallLimitTrials;

    ExportDbCsvConcepts.exportRulesetConceptsCSV(evaluation, numPlayouts, timeLimit, thinkingTime, agentName, gameName, rulesetName, agentName2);
  }

  // -------------------------------------------------------------------------

  /**
   * To create Concepts.csv (Id, Name, Description, TypeId, DataTypeId)
   * @java ExportDbCsvConcepts.exportConceptCSV()
   */
  public static exportConceptCSV(): void {
    const toNotShowOnWebsite: string[] = [
      "Properties", "Format", "Time", "Turns", "Players", "Equipment",
      "Board", "Container", "Component", "Rules", "Play", "Efficiency",
      "Implementation", "Visual", "Style", "Math", "Behaviour"
    ];

    const outputConcept = "Concepts.csv";
    console.log("Writing Concepts.csv");
    const writer = new UnixPrintWriter(outputConcept);
    try {
      for (const concept of allConceptValues()) {
        const name = conceptName(concept);
        const lineToWrite: string[] = [];
        lineToWrite.push(conceptId(concept) + "");
        lineToWrite.push("\"" + name + "\"");
        lineToWrite.push("\"" + conceptDescription(concept) + "\"");
        lineToWrite.push(conceptTypeId(conceptType(concept)) + "");
        lineToWrite.push(conceptDataTypeId(conceptDataType(concept)) + "");
        lineToWrite.push(conceptComputationTypeId(conceptComputationType(concept)) + "");
        lineToWrite.push("\"" + conceptTaxonomy(concept) + "\"");
        lineToWrite.push(conceptIsLeaf(concept) ? "1" : "0");
        lineToWrite.push(toNotShowOnWebsite.includes(name) ? "0" : "1");
        writer.printlnStr(StringRoutines.join(",", lineToWrite));
      }
    } catch (e) {
      console.error(e);
    }
    fs.writeFileSync(outputConcept, writer.flush(), "utf-8");
    console.log("Done.");
  }

  // -------------------------------------------------------------------------

  /**
   * To create ConceptTypes.csv (Id, Name)
   * @java ExportDbCsvConcepts.exportConceptTypeCSV()
   */
  public static exportConceptTypeCSV(): void {
    const outputConceptType = "ConceptTypes.csv";
    console.log("Writing ConceptTypes.csv");
    const writer = new UnixPrintWriter(outputConceptType);
    try {
      for (const conceptTypeVal of (Object.values(ConceptType).filter(v => typeof v === "number") as ConceptType[])) {
        const name = ConceptType[conceptTypeVal] as string;
        const lineToWrite: string[] = [];
        lineToWrite.push(conceptTypeId(conceptTypeVal) + "");
        lineToWrite.push("\"" + name + "\"");
        writer.printlnStr(StringRoutines.join(",", lineToWrite));
      }
    } catch (e) {
      console.error(e);
    }
    fs.writeFileSync(outputConceptType, writer.flush(), "utf-8");
    console.log("Done.");
  }

  // -------------------------------------------------------------------------

  /**
   * To create ConceptDataTypes.csv (Id, Name)
   * @java ExportDbCsvConcepts.exportConceptDataTypeCSV()
   */
  public static exportConceptDataTypeCSV(): void {
    const outputDataType = "ConceptDataTypes.csv";
    console.log("Writing ConceptDataTypes.csv");
    const writer = new UnixPrintWriter(outputDataType);
    try {
      for (const dataType of (Object.values(ConceptDataType).filter(v => typeof v === "number") as ConceptDataType[])) {
        const name = ConceptDataType[dataType] as string;
        const lineToWrite: string[] = [];
        lineToWrite.push(conceptDataTypeId(dataType) + "");
        lineToWrite.push("\"" + name + "\"");
        writer.printlnStr(StringRoutines.join(",", lineToWrite));
      }
    } catch (e) {
      console.error(e);
    }
    fs.writeFileSync(outputDataType, writer.flush(), "utf-8");
    console.log("Done.");
  }

  // -------------------------------------------------------------------------

  /**
   * To create ConceptComputationTypes.csv (Id, Name)
   * @java ExportDbCsvConcepts.exportConceptComputationTypeCSV()
   */
  public static exportConceptComputationTypeCSV(): void {
    const outputComputationType = "ConceptComputationTypes.csv";
    console.log("Writing ConceptComputationTypes.csv");
    const writer = new UnixPrintWriter(outputComputationType);
    try {
      for (const dataType of (Object.values(ConceptComputationType).filter(v => typeof v === "number") as ConceptComputationType[])) {
        const name = ConceptComputationType[dataType] as string;
        const lineToWrite: string[] = [];
        lineToWrite.push(conceptComputationTypeId(dataType) + "");
        lineToWrite.push("\"" + name + "\"");
        writer.printlnStr(StringRoutines.join(",", lineToWrite));
      }
    } catch (e) {
      console.error(e);
    }
    fs.writeFileSync(outputComputationType, writer.flush(), "utf-8");
    console.log("Done.");
  }

  // -------------------------------------------------------------------------

  /**
   * To create ConceptPurposes.csv (Id, Name)
   * @java ExportDbCsvConcepts.exportConceptPurposeCSV()
   */
  public static exportConceptPurposeCSV(): void {
    const outputConceptPurposes = "ConceptPurposes.csv";
    console.log("Writing ConceptPurposes.csv");
    const writer = new UnixPrintWriter(outputConceptPurposes);
    try {
      for (const purpose of (Object.values(ConceptPurpose).filter(v => typeof v === "number") as ConceptPurpose[])) {
        const name = ConceptPurpose[purpose] as string;
        const lineToWrite: string[] = [];
        lineToWrite.push(conceptPurposeId(purpose) + "");
        lineToWrite.push("\"" + name + "\"");
        writer.printlnStr(StringRoutines.join(",", lineToWrite));
      }
    } catch (e) {
      console.error(e);
    }
    fs.writeFileSync(outputConceptPurposes, writer.flush(), "utf-8");
    console.log("Done.");
  }

  // -------------------------------------------------------------------------

  /**
   * To create ConceptConceptPurposes.csv (Id, ConceptId, PurposeId)
   * @java ExportDbCsvConcepts.exportConceptConceptPurposesCSV()
   */
  public static exportConceptConceptPurposesCSV(): void {
    const outputConceptConceptPurposes = "ConceptConceptPurposes.csv";
    console.log("Writing ConceptConceptPurposes.csv");
    const writer = new UnixPrintWriter(outputConceptConceptPurposes);
    try {
      let id = 1;
      for (const concept of allConceptValues()) {
        for (const purpose of conceptPurposes(concept)) {
          const lineToWrite: string[] = [];
          lineToWrite.push(id + "");
          lineToWrite.push(conceptId(concept) + "");
          lineToWrite.push(conceptPurposeId(purpose) + "");
          writer.printlnStr(StringRoutines.join(",", lineToWrite));
          id++;
        }
      }
    } catch (e) {
      console.error(e);
    }
    fs.writeFileSync(outputConceptConceptPurposes, writer.flush(), "utf-8");
    console.log("Done.");
  }

  // -------------------------------------------------------------------------

  /**
   * To create RulesetConcepts.csv (Id, RulesetId, ConceptId, Value)
   *
   * @param numPlayouts     The maximum number of playout.
   * @param timeLimit       The maximum time to compute the playouts concepts.
   * @param thinkingTime    The maximum time to take a decision per move.
   * @param agentName       The name of the agent to use for the playout concepts
   * @param name            The name of the game.
   * @param rulesetExpected The name of the ruleset of the game.
   * @param agentName2      The name for a different second agent (if not empty string)
   * @java ExportDbCsvConcepts.exportRulesetConceptsCSV(Evaluation,int,double,double,String,String,String,String)
   */
  public static exportRulesetConceptsCSV(
    evaluation: EvaluationLike,
    numPlayouts: number,
    timeLimit: number,
    thinkingTime: number,
    agentName: string,
    name: string,
    rulesetExpected: string,
    agentName2: string
  ): void {
    const ignoredConcepts: Concept[] = [
      Concept.Behaviour, Concept.StateRepetition, Concept.Duration,
      Concept.Complexity, Concept.BoardCoverage, Concept.GameOutcome,
      Concept.StateEvaluation, Concept.Clarity, Concept.Decisiveness,
      Concept.Drama, Concept.MoveEvaluation, Concept.StateEvaluationDifference,
      Concept.BoardSitesOccupied, Concept.BranchingFactor, Concept.DecisionFactor,
      Concept.MoveDistance, Concept.PieceNumber, Concept.ScoreDifference
    ];

    const games: string[] = [];
    const rulesets: string[] = [];
    const ids: number[] = [];

    // Get the ids of the rulesets.
    try {
      const resourcePath = path.join(
        path.dirname(new URL(import.meta.url).pathname),
        GAME_RULESET_PATH
      );
      const content = fs.readFileSync(resourcePath, "utf-8");
      for (const line of content.split("\n")) {
        if (line.trim().length === 0) continue;
        let lineNoQuote = line.replace(/"/g, "");

        let separatorIndex = lineNoQuote.indexOf(",");
        const gameName = lineNoQuote.substring(0, separatorIndex);
        games.push(gameName);
        lineNoQuote = lineNoQuote.substring(gameName.length + 1);

        separatorIndex = lineNoQuote.indexOf(",");
        const rulesetName = lineNoQuote.substring(0, separatorIndex);
        rulesets.push(rulesetName);
        lineNoQuote = lineNoQuote.substring(rulesetName.length + 1);
        const id = parseInt(lineNoQuote.trim(), 10);
        ids.push(id);
      }
    } catch (e) {
      console.error(e);
    }

    const fileName = name.length === 0
      ? ""
      : name.substring(name.lastIndexOf("/") + 1, name.length - 4).replace(/ /g, "");
    const outputRulesetConcepts = rulesetExpected.length === 0
      ? "RulesetConcepts" + fileName + ".csv"
      : "RulesetConcepts" + fileName + "-" + rulesetExpected.substring(8) + ".csv";
    console.log("Writing " + outputRulesetConcepts);

    // Do nothing if the files already exist.
    if (fs.existsSync(outputRulesetConcepts))
      return;

    // Computation of the concepts
    const writer = new UnixPrintWriter(outputRulesetConcepts);
    try {
      const booleanConcepts: Concept[] = [];
      const nonBooleanConcepts: Concept[] = [];
      for (const concept of allConceptValues()) {
        if (conceptDataType(concept) === ConceptDataType.BooleanData)
          booleanConcepts.push(concept);
        else
          nonBooleanConcepts.push(concept);
      }

      let id = 1;

      const gameNames = FileHandling.listGames();

      // Check only the games wanted
      for (let index = 0; index < gameNames.length; index++) {
        const gameName = gameNames[index]!;
        if (gameName.replace(/\\/g, "/").includes("/lud/bad/"))
          continue;

        if (gameName.replace(/\\/g, "/").includes("/lud/wip/"))
          continue;

        if (gameName.replace(/\\/g, "/").includes("/lud/WishlistDLP/"))
          continue;

        if (gameName.replace(/\\/g, "/").includes("/lud/test/"))
          continue;

        if (gameName.replace(/\\/g, "/").includes("subgame"))
          continue;

        if (gameName.replace(/\\/g, "/").includes("reconstruction/pending/"))
          continue;

        if (gameName.replace(/\\/g, "/").includes("reconstruction/validation/"))
          continue;

        if (name.length > 0 && gameName.substring(1) !== name.replace(/\\/g, "/"))
          continue;

        const game = GameLoader.loadGameFromName(gameName) as unknown as GameLike;
        game.setMaxMoveLimit(moveLimit);
        game.start({} as unknown as ContextLike);

        console.log("Loading game: " + game.name());

        const rulesetsInGame = game.description().rulesets();

        // Code for games with many rulesets
        if (rulesetsInGame !== null && rulesetsInGame.length > 0) {
          for (let rs = 0; rs < rulesetsInGame.length; rs++) {
            const ruleset = rulesetsInGame[rs]!;

            // We check if we want a specific ruleset.
            if (rulesetExpected.length > 0 && rulesetExpected !== ruleset.heading())
              continue;

            const rulesetOptions = ruleset.optionSettings();
            if (
              rulesetOptions.length > 0 &&
              !ruleset.heading().includes("Incomplete")
            ) {
              const rulesetGame = GameLoader.loadGameFromName(gameName, rulesetOptions) as unknown as GameLike;
              rulesetGame.setMaxMoveLimit(moveLimit);

              console.log("Loading ruleset: " + rulesetGame.getRuleset()!.heading());
              const playoutConcepts: Map<string, number | null> = numPlayouts === 0
                ? new Map()
                : ExportDbCsvConcepts.playoutsMetrics(rulesetGame, evaluation, numPlayouts, timeLimit, thinkingTime, agentName, agentName2);

              const idRuleset = IdRuleset.get(rulesetGame as unknown as Parameters<typeof IdRuleset.get>[0]);
              const concepts = rulesetGame.booleanConcepts();
              const nonBooleanConceptsValues = rulesetGame.nonBooleanConcepts();

              // Boolean concepts
              for (const concept of booleanConcepts) {
                const lineToWrite: string[] = [];
                lineToWrite.push(id + ""); // id
                lineToWrite.push(idRuleset + ""); // id ruleset
                lineToWrite.push(conceptId(concept) + ""); // id concept
                if (ignoredConcepts.includes(concept))
                  lineToWrite.push("NULL");
                else if (concepts.get(conceptId(concept)))
                  lineToWrite.push("\"1\"");
                else
                  lineToWrite.push("\"0\"");
                writer.printlnStr(StringRoutines.join(",", lineToWrite));
                id++;
              }

              console.log("NON BOOLEAN CONCEPTS");
              // Non Boolean Concepts
              for (const concept of nonBooleanConcepts) {
                if (conceptComputationType(concept) === ConceptComputationType.Compilation) {
                  const lineToWrite: string[] = [];
                  lineToWrite.push(id + "");
                  lineToWrite.push(idRuleset + "");
                  lineToWrite.push(conceptId(concept) + "");
                  lineToWrite.push(
                    "\"" + nonBooleanConceptsValues.get(conceptId(concept)) + "\""
                  );
                  writer.printlnStr(StringRoutines.join(",", lineToWrite));
                  id++;
                } else {
                  const cName = conceptName(concept);
                  if (!cName.includes("Frequency")) {
                    // Non Frequency concepts added to the csv.
                    const value = playoutConcepts.get(cName);
                    const lineToWrite: string[] = [];
                    lineToWrite.push(id + "");
                    lineToWrite.push(idRuleset + "");
                    lineToWrite.push(conceptId(concept) + "");
                    lineToWrite.push(
                      value == null || value === -1
                        ? "NULL"
                        : "\"" + decimalFormat(value) + "\""
                    );
                    writer.printlnStr(StringRoutines.join(",", lineToWrite));
                    id++;
                  } else {
                    // Frequency concepts added to the csv.
                    const correspondingBooleanConceptName = cName.substring(
                      0, cName.indexOf("Frequency")
                    );
                    for (const correspondingConcept of booleanConcepts) {
                      if (conceptName(correspondingConcept) === correspondingBooleanConceptName) {
                        const lineToWrite: string[] = [];
                        lineToWrite.push(id + "");
                        lineToWrite.push(idRuleset + "");
                        lineToWrite.push(conceptId(concept) + "");
                        const frequency = playoutConcepts.get(conceptName(correspondingConcept)) ?? -1;
                        if (frequency != null && frequency > 0)
                          console.log(cName + " = " + (frequency * 100) + "%");
                        lineToWrite.push(
                          (frequency != null && frequency > 0
                            ? "\"" + decimalFormat(frequency) + "\""
                            : "0") + ""
                        );
                        writer.printlnStr(StringRoutines.join(",", lineToWrite));
                        id++;
                      }
                    }
                  }
                }
              }
            }
          }
        } else {
          // Code for games with only a single ruleset.
          const playoutConcepts: Map<string, number | null> = numPlayouts === 0
            ? new Map()
            : ExportDbCsvConcepts.playoutsMetrics(game, evaluation, numPlayouts, timeLimit, thinkingTime, agentName, agentName2);

          const idRuleset = IdRuleset.get(game as unknown as Parameters<typeof IdRuleset.get>[0]);
          const concepts = game.booleanConcepts();

          for (const concept of booleanConcepts) {
            const lineToWrite: string[] = [];
            lineToWrite.push(id + "");
            lineToWrite.push(idRuleset + "");
            lineToWrite.push(conceptId(concept) + "");
            if (ignoredConcepts.includes(concept))
              lineToWrite.push("NULL");
            else if (concepts.get(conceptId(concept)))
              lineToWrite.push("\"1\"");
            else
              lineToWrite.push("\"0\"");
            writer.printlnStr(StringRoutines.join(",", lineToWrite));
            id++;
          }

          for (const concept of nonBooleanConcepts) {
            if (conceptComputationType(concept) === ConceptComputationType.Compilation) {
              const lineToWrite: string[] = [];
              lineToWrite.push(id + "");
              lineToWrite.push(idRuleset + "");
              lineToWrite.push(conceptId(concept) + "");
              lineToWrite.push(
                "\"" + game.nonBooleanConcepts().get(conceptId(concept)) + "\""
              );
              writer.printlnStr(StringRoutines.join(",", lineToWrite));
              id++;
            } else {
              const cName = conceptName(concept);
              if (!cName.includes("Frequency")) {
                // Non Frequency concepts added to the csv.
                const value = playoutConcepts.get(cName);
                const lineToWrite: string[] = [];
                lineToWrite.push(id + "");
                lineToWrite.push(idRuleset + "");
                lineToWrite.push(conceptId(concept) + "");
                lineToWrite.push(
                  value == null || value === -1
                    ? "NULL"
                    : "\"" + decimalFormat(value) + "\""
                );
                writer.printlnStr(StringRoutines.join(",", lineToWrite));
                id++;
//              if(value != 0)
//                console.log("metric: " + concept + " value is " + value);
              } else {
                // Frequency concepts added to the csv.
                const correspondingBooleanConceptName = cName.substring(
                  0, cName.indexOf("Frequency")
                );
                for (const correspondingConcept of booleanConcepts) {
                  if (conceptName(correspondingConcept) === correspondingBooleanConceptName) {
                    const lineToWrite: string[] = [];
                    lineToWrite.push(id + "");
                    lineToWrite.push(idRuleset + "");
                    lineToWrite.push(conceptId(concept) + "");
                    const frequency = playoutConcepts.get(conceptName(correspondingConcept)) ?? -1;
                    if (frequency != null && frequency > 0)
                      console.log(cName + " = " + (frequency * 100) + "%");
                    lineToWrite.push(
                      (frequency != null && frequency > 0
                        ? "\"" + decimalFormat(frequency) + "\""
                        : "0") + ""
                    );
                    writer.printlnStr(StringRoutines.join(",", lineToWrite));
                    id++;
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    fs.writeFileSync(outputRulesetConcepts, writer.flush(), "utf-8");
    console.log("Done.");
  }

  // ------------------------------PLAYOUT CONCEPTS-----------------------------------------------------

  /**
   * @param game         The game
   * @param playoutLimit The number of playouts to run.
   * @param timeLimit    The maximum time to use.
   * @param thinkingTime The maximum time to take a decision at each state.
   * @return The frequency of all the boolean concepts in the number of playouts set in entry
   * @java ExportDbCsvConcepts.playoutsMetrics(Game,Evaluation,int,double,double,String,String)
   */
  private static playoutsMetrics(
    game: GameLike,
    evaluation: EvaluationLike,
    playoutLimit: number,
    timeLimit: number,
    thinkingTime: number,
    agentName: string,
    agentName2: string
  ): Map<string, number | null> {
    const startTime = Date.now();

    // Used to return the frequency (of each playout concept).
    const mapFrequency = new Map<string, number | null>();

    // For now I exclude the matches, but can be included too after. The deduc puzzle will stay excluded.
    if (game.name().includes("Kriegsspiel")) {
      // We add all the default metrics values corresponding to a concept to the returned map.
      const metrics = new Evaluation().conceptMetrics() as unknown as MetricLike[];
      for (const metric of metrics)
        if (metric.concept() !== null)
          mapFrequency.set(conceptName(metric.concept()!), null);

      // Computation of the p/s and m/s
      for (const [k, v] of ExportDbCsvConcepts.playoutsEstimationConcepts(game))
        mapFrequency.set(k, v);

      return mapFrequency;
    }

    // We run the playouts needed for the computation.
    if (folderTrials.length === 0) {
      // Create list of AI objects to be used in all trials
      const aisAllTrials = ExportDbCsvConcepts.chooseAI(game, agentName, agentName2, 0);

      for (const ai of aisAllTrials)
        if (ai !== null)
          ai.setMaxSecondsPerMove(thinkingTime);

      const numPlayers = game.players().count();

      // Generate permutations (simplified: generate up to 120 if > 5 players)
      let aiListPermutations: number[][] = [];
      if (numPlayers <= 5) {
        aiListPermutations = ExportDbCsvConcepts.generatePermutations(
          Array.from({ length: numPlayers }, (_, i) => i)
        );
        // shuffle
        for (let i = aiListPermutations.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [aiListPermutations[i], aiListPermutations[j]] = [aiListPermutations[j]!, aiListPermutations[i]!];
        }
      } else {
        for (let k = 0; k < 120; k++) {
          const perm = Array.from({ length: numPlayers }, (_, i) => i);
          for (let i = perm.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [perm[i], perm[j]] = [perm[j]!, perm[i]!];
          }
          aiListPermutations.push(perm);
        }
      }

      let playoutsDone = 0;
      for (let indexPlayout = 0; indexPlayout < playoutLimit; indexPlayout++) {
        // Create re-ordered list of AIs for this particular playout
        const ais: (AILike | null)[] = [null];
        const currentAIsPermutation = indexPlayout % aiListPermutations.length;
        const currentPlayersPermutation = aiListPermutations[currentAIsPermutation]!;
        for (let i = 0; i < currentPlayersPermutation.length; ++i) {
          ais.push(
            aisAllTrials[currentPlayersPermutation[i]! % aisAllTrials.length] ?? null
          );
        }

        const context = ExportDbCsvConcepts.createContext(game);
        allStoredRNG.push(context.rng?.().saveState() ?? {});
        const trial = context.trial?.();
        game.start(context);

        // Init the ais.
        for (let p = 1; p <= game.players().count(); ++p)
          ais[p]?.initAI(game, p);
        const model = context.model?.();

        while (!trial.over())
          model.startNewStep(context, ais, thinkingTime);

        trials.push(trial);
        playoutsDone++;

        for (let p = 1; p <= game.players().count(); ++p)
          ais[p]?.closeAI();

        const currentTimeUsed = (Date.now() - startTime) / 1000.0;
        if (currentTimeUsed > timeLimit) // We stop if the limit of time is reached.
          break;
      }

      const allSeconds = (Date.now() - startTime) / 1000.0;
      const seconds = Math.floor(allSeconds % 60.0);
      const minutes = Math.floor((allSeconds - seconds) / 60.0);
      console.log(
        "Playouts done in " + minutes + " minutes " + seconds + " seconds. " + playoutsDone + " playouts."
      );
    } else {
      ExportDbCsvConcepts.getTrials(game);
    }

    // We get the values of the frequencies.
    for (const [k, v] of ExportDbCsvConcepts.frequencyConcepts(game))
      mapFrequency.set(k, v);

    const reconstructionConcepts: Concept[] = [
      Concept.DurationTurns, Concept.DurationTurnsStdDev,
      Concept.DurationTurnsNotTimeouts, Concept.DecisionMoves,
      Concept.BoardCoverageDefault,
      // Concept.AdvantageP1 — not in TS enum port yet
      Concept.Balance, Concept.Completion, Concept.Timeouts,
      Concept.Drawishness, Concept.PieceNumberAverage,
      Concept.BoardSitesOccupiedAverage, Concept.BranchingFactorAverage,
      Concept.DecisionFactorAverage
    ];

    // We get the values of the metrics.
    for (const [k, v] of ExportDbCsvConcepts.metricsConcepts(game, evaluation, reconstructionConcepts))
      mapFrequency.set(k, v);

    // We get the values of the starting concepts.
    for (const [k, v] of ExportDbCsvConcepts.startsConcepts(game))
      mapFrequency.set(k, v);

    // Computation of the p/s and m/s
    for (const [k, v] of ExportDbCsvConcepts.playoutsEstimationConcepts(game))
      mapFrequency.set(k, v);

    return mapFrequency;
  }

  /**
   * @param game The game.
   * @java ExportDbCsvConcepts.getTrials(Game)
   */
  private static getTrials(game: GameLike): void {
    const currentFolder = process.cwd();
    const folder = path.join(currentFolder, folderTrials);
    const gName = game.name();
    const rName = game.getRuleset() === null
      ? ""
      : game.getRuleset()!.heading();

    let trialFolderPath = path.join(folder, gName);
    if (rName.length > 0)
      trialFolderPath = path.join(trialFolderPath, rName.replace(/\//g, "_"));

    const trialFolderExists = fs.existsSync(trialFolderPath);
    if (trialFolderExists)
      console.log("TRIALS FOLDER EXIST");
    else
      console.log("DO NOT FOUND IT - Path is " + trialFolderPath);

    let limit = -1; // Constants.UNDEFINED
    if (evenLessTrialsGames.includes(gName))
      limit = smallestLimitTrials;
    else if (lessTrialsGames.includes(gName))
      limit = smallLimitTrials;

    const MatchRecord = (globalThis as unknown as {
      MatchRecord?: { loadMatchRecordFromTextFile: (file: string, game: GameLike) => MatchRecordLike }
    }).MatchRecord;

    if (!MatchRecord) return;

    let num = 0;
    const files = fs.readdirSync(trialFolderPath);
    for (const fileName of files) {
      console.log(fileName);
      if (fileName.includes(".txt")) {
        try {
          const loadedRecord = MatchRecord.loadMatchRecordFromTextFile(
            path.join(trialFolderPath, fileName),
            game
          );
          const loadedTrial = loadedRecord.trial();
          trials.push(loadedTrial);
          allStoredRNG.push(loadedRecord.rngState());
          num++;
          if (num === limit)
            break;
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  /**
   * @param game         The game.
   * @param agentName    The name of the agent.
   * @param agentName2   The name of the second agent (can be empty string if not used).
   * @param indexPlayout The index of the playout.
   * @return The list of AIs to play that playout.
   * @java ExportDbCsvConcepts.chooseAI(Game,String,String,int)
   */
  private static chooseAI(
    game: GameLike,
    agentName: string,
    agentName2: string,
    indexPlayout: number
  ): (AILike | null)[] {
    const ais: (AILike | null)[] = [];

    const AIFactory = (globalThis as unknown as { AIFactory?: AIFactoryLike }).AIFactory;
    if (!AIFactory) return ais;

    const RandomAI = (globalThis as unknown as { RandomAI?: new () => AILike }).RandomAI;
    const makeRandomAI = (): AILike =>
      RandomAI ? new RandomAI() : ({} as AILike);

    const AlphaBetaSearch = (globalThis as unknown as {
      AlphaBetaSearch?: new () => AILike & {
        setAllowedSearchDepths: (d: unknown) => void;
      };
    }).AlphaBetaSearch;
    const AllowedSearchDepths = (globalThis as unknown as {
      AllowedSearchDepths?: { Odd: unknown; Even: unknown }
    }).AllowedSearchDepths;

    if (agentName2.length > 0) {
      // Special case where we have provided two different names
      if (game.players().count() === 2) {
        ais.push(AIFactory.createAI(agentName));
        ais.push(AIFactory.createAI(agentName2));
        return ais;
      } else {
        console.error("Provided 2 agent names, but not a 2-player game!");
      }
    }

    // Continue with Eric's original implementation
    for (let p = 1; p <= game.players().count(); ++p) {
      if (agentName === "UCT") {
        const ai = AIFactory.createAI("UCT");
        if (ai.supportsGame(game)) {
          ais.push(ai);
        } else {
          ais.push(makeRandomAI());
        }
      } else if (agentName === "Alpha-Beta") {
        const ai = AIFactory.createAI("Alpha-Beta");
        if (ai.supportsGame(game)) {
          ais.push(ai);
        } else if (AIFactory.createAI("UCT").supportsGame(game)) {
          ais.push(AIFactory.createAI("UCT"));
        } else {
          ais.push(makeRandomAI());
        }
      } else if (agentName === "Alpha-Beta-UCT") { // AB/UCT/AB/UCT/...
        if (indexPlayout % 2 === 0) {
          if (p % 2 === 1) {
            const ai = AIFactory.createAI("Alpha-Beta");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else if (AIFactory.createAI("UCT").supportsGame(game)) {
              ais.push(AIFactory.createAI("UCT"));
            } else {
              ais.push(makeRandomAI());
            }
          } else {
            const ai = AIFactory.createAI("UCT");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else {
              ais.push(makeRandomAI());
            }
          }
        } else {
          if (p % 2 === 1) {
            const ai = AIFactory.createAI("UCT");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else {
              ais.push(makeRandomAI());
            }
          } else {
            const ai = AIFactory.createAI("Alpha-Beta");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else if (AIFactory.createAI("UCT").supportsGame(game)) {
              ais.push(AIFactory.createAI("UCT"));
            } else {
              ais.push(makeRandomAI());
            }
          }
        }
      } else if (agentName === "ABONEPLY") { // AB/ONEPLY/AB/ONEPLY/...
        if (indexPlayout % 2 === 0) {
          if (p % 2 === 1) {
            const ai = AIFactory.createAI("Alpha-Beta");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else if (AIFactory.createAI("One-Ply (No Heuristic)").supportsGame(game)) {
              ais.push(AIFactory.createAI("One-Ply (No Heuristic)"));
            } else {
              ais.push(makeRandomAI());
            }
          } else {
            const ai = AIFactory.createAI("One-Ply (No Heuristic)");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else {
              ais.push(makeRandomAI());
            }
          }
        } else {
          if (p % 2 === 1) {
            const ai = AIFactory.createAI("One-Ply (No Heuristic)");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else {
              ais.push(makeRandomAI());
            }
          } else {
            const ai = AIFactory.createAI("Alpha-Beta");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else if (AIFactory.createAI("One-Ply (No Heuristic)").supportsGame(game)) {
              ais.push(AIFactory.createAI("One-Ply (No Heuristic)"));
            } else {
              ais.push(makeRandomAI());
            }
          }
        }
      } else if (agentName === "UCTONEPLY") { // UCT/ONEPLY/UCT/ONEPLY/...
        if (indexPlayout % 2 === 0) {
          if (p % 2 === 1) {
            const ai = AIFactory.createAI("UCT");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else if (AIFactory.createAI("One-Ply (No Heuristic)").supportsGame(game)) {
              ais.push(AIFactory.createAI("One-Ply (No Heuristic)"));
            } else {
              ais.push(makeRandomAI());
            }
          } else {
            const ai = AIFactory.createAI("One-Ply (No Heuristic)");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else {
              ais.push(makeRandomAI());
            }
          }
        } else {
          if (p % 2 === 1) {
            const ai = AIFactory.createAI("One-Ply (No Heuristic)");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else {
              ais.push(makeRandomAI());
            }
          } else {
            const ai = AIFactory.createAI("UCT");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else if (AIFactory.createAI("One-Ply (No Heuristic)").supportsGame(game)) {
              ais.push(AIFactory.createAI("One-Ply (No Heuristic)"));
            } else {
              ais.push(makeRandomAI());
            }
          }
        }
      } else if (agentName === "AB-Odd-Even") { // Alternating between AB Odd and AB Even
        if (indexPlayout % 2 === 0) {
          if (p % 2 === 1) {
            if (AlphaBetaSearch && AllowedSearchDepths) {
              const ai = new AlphaBetaSearch();
              ai.setAllowedSearchDepths(AllowedSearchDepths.Odd);
              if (ai.supportsGame(game)) {
                ais.push(ai);
              } else if (AIFactory.createAI("UCT").supportsGame(game)) {
                ais.push(AIFactory.createAI("UCT"));
              } else {
                ais.push(makeRandomAI());
              }
            } else {
              ais.push(makeRandomAI());
            }
          } else {
            if (AlphaBetaSearch && AllowedSearchDepths) {
              const ai = new AlphaBetaSearch();
              ai.setAllowedSearchDepths(AllowedSearchDepths.Even);
              if (ai.supportsGame(game)) {
                ais.push(ai);
              } else {
                ais.push(makeRandomAI());
              }
            } else {
              ais.push(makeRandomAI());
            }
          }
        } else {
          if (p % 2 === 1) {
            if (AlphaBetaSearch && AllowedSearchDepths) {
              const ai = new AlphaBetaSearch();
              ai.setAllowedSearchDepths(AllowedSearchDepths.Even);
              if (ai.supportsGame(game)) {
                ais.push(ai);
              } else {
                ais.push(makeRandomAI());
              }
            } else {
              ais.push(makeRandomAI());
            }
          } else {
            if (AlphaBetaSearch && AllowedSearchDepths) {
              const ai = new AlphaBetaSearch();
              ai.setAllowedSearchDepths(AllowedSearchDepths.Odd);
              if (ai.supportsGame(game)) {
                ais.push(ai);
              } else if (AIFactory.createAI("UCT").supportsGame(game)) {
                ais.push(AIFactory.createAI("UCT"));
              } else {
                ais.push(makeRandomAI());
              }
            } else {
              ais.push(makeRandomAI());
            }
          }
        }
      } else {
        ais.push(makeRandomAI());
      }
    }
    return ais;
  }

  /**
   * @param game The game.
   * @return The map of playout concepts to the their values for the starting ones.
   * @java ExportDbCsvConcepts.startsConcepts(Game)
   */
  private static startsConcepts(game: GameLike): Map<string, number> {
    const mapStarting = new Map<string, number>();
    const startTime = Date.now();

    const booleanConcepts = game.booleanConcepts();
    let numStartComponents = 0.0;
    let numStartComponentsHands = 0.0;
    let numStartComponentsBoard = 0.0;

    // Check for each initial state of the game.
    for (let index = 0; index < allStoredRNG.length; index++) {
      const rngState = allStoredRNG[index]!;

      // Setup a new instance of the game
      const context = ExportDbCsvConcepts.setupNewContext(game, rngState);
      const containers = context.containers?.() ?? [];
      for (let cid = 0; cid < containers.length; cid++) {
        const cont = containers[cid]!;
        const cs = context.containerState?.(cid) ?? ({} as unknown as ContainerStateLike);
        if (cid === 0) {
          if (booleanConcepts.get(conceptId(Concept.Cell)))
            for (let cell = 0; cell < cont.topology().cells().length; cell++) {
              const count = game.isStacking()
                ? cs.sizeStack(cell, SiteTypeCell)
                : cs.count(cell, SiteTypeCell);
              numStartComponents += count;
              numStartComponentsBoard += count;
            }

          if (booleanConcepts.get(conceptId(Concept.Vertex)))
            for (let vertex = 0; vertex < cont.topology().vertices().length; vertex++) {
              const count = game.isStacking()
                ? cs.sizeStack(vertex, SiteTypeVertex)
                : cs.count(vertex, SiteTypeVertex);
              numStartComponents += count;
              numStartComponentsBoard += count;
            }

          if (booleanConcepts.get(conceptId(Concept.Edge)))
            for (let edge = 0; edge < cont.topology().edges().length; edge++) {
              const count = game.isStacking()
                ? cs.sizeStack(edge, SiteTypeEdge)
                : cs.count(edge, SiteTypeEdge);
              numStartComponents += count;
              numStartComponentsBoard += count;
            }
        } else {
          const sitesFrom = context.sitesFrom?.() ?? [];
          if (booleanConcepts.get(conceptId(Concept.Cell)))
            for (
              let cell = sitesFrom[cid] ?? 0;
              cell < (sitesFrom[cid] ?? 0) + cont.topology().cells().length;
              cell++
            ) {
              const count = game.isStacking()
                ? cs.sizeStack(cell, SiteTypeCell)
                : cs.count(cell, SiteTypeCell);
              numStartComponents += count;
              numStartComponentsHands += count;
            }
        }
      }
    }

    const rngCount = allStoredRNG.length === 0 ? 1 : allStoredRNG.length;
    const playerCount = game.players().count() === 0 ? 1 : game.players().count();

    mapStarting.set(conceptName(Concept.NumStartComponents), numStartComponents / rngCount);
    mapStarting.set(conceptName(Concept.NumStartComponentsHand), numStartComponentsHands / rngCount);
    mapStarting.set(conceptName(Concept.NumStartComponentsBoard), numStartComponentsBoard / rngCount);
    mapStarting.set(conceptName(Concept.NumStartComponentsPerPlayer), (numStartComponents / rngCount) / playerCount);
    mapStarting.set(conceptName(Concept.NumStartComponentsHandPerPlayer), (numStartComponentsHands / rngCount) / playerCount);
    mapStarting.set(conceptName(Concept.NumStartComponentsBoardPerPlayer), (numStartComponentsBoard / rngCount) / playerCount);

    const allMilliSecond = Date.now() - startTime;
    const allSeconds2 = allMilliSecond / 1000.0;
    const seconds2 = Math.floor(allSeconds2 % 60.0);
    const minutes2 = Math.floor((allSeconds2 - seconds2) / 60.0);
    const milliSeconds2 = Math.floor(allMilliSecond - (seconds2 * 1000));
    console.log("Starting concepts done in " + minutes2 + " minutes " + seconds2 + " seconds " + milliSeconds2 + " ms.");

    return mapStarting;
  }

  // ------------------------------Frequency CONCEPTS-----------------------------------------------------

  /**
   * @param game         The game.
   * @return The map of playout concepts to the their values for the frequency ones.
   * @java ExportDbCsvConcepts.frequencyConcepts(Game)
   */
  private static frequencyConcepts(game: GameLike): Map<string, number> {
    const mapFrequency = new Map<string, number>();
    const startTime = Date.now();
    // Frequencies of the moves.
    const frequencyMoveConcepts: number[] = [];

    const conceptValues = allConceptValues();

    // Frequencies returned by all the playouts.
    const frequencyPlayouts: number[] = new Array<number>(conceptValues.length).fill(0.0);

    for (let trialIndex = 0; trialIndex < trials.length; trialIndex++) {
      const trial = trials[trialIndex]!;
      const rngState = allStoredRNG[trialIndex]!;

      const context = ExportDbCsvConcepts.setupNewContext(game, rngState);

      // Frequencies returned by that playout.
      const frequencyPlayout: number[] = new Array<number>(conceptValues.length).fill(0);

      // Run the playout.
      let turnWithMoves = 0;
      let prevContext: ContextLike | null = null;
      for (let i = trial.numInitialPlacementMoves(); i < trial.numMoves(); i++) {
        const legalMoves = context.game?.().moves(context);
        const frequencyTurn: number[] = new Array<number>(conceptValues.length).fill(0);

        const numLegalMoves = legalMoves?.moves().length ?? 0;
        if (numLegalMoves > 0)
          turnWithMoves++;

        const moves = legalMoves?.moves() ?? [];
        for (const legalMove of moves) {
          const moveConcepts = legalMove.moveConcepts(context);
          for (let indexConcept = 0; indexConcept < conceptValues.length; indexConcept++) {
            const concept = conceptValues[indexConcept]!;
            if (moveConcepts.get(conceptId(concept)))
              frequencyTurn[indexConcept] = (frequencyTurn[indexConcept] ?? 0) + 1;
          }
        }

        for (let j = 0; j < frequencyTurn.length; j++)
          frequencyPlayout[j] = (frequencyPlayout[j] ?? 0) +
            (numLegalMoves === 0 ? 0 : (frequencyTurn[j] ?? 0) / numLegalMoves);

        // We keep the context before the ending state for the frequencies of the end conditions.
        if (i === trial.numMoves() - 1)
          prevContext = context;

        // We go to the next move.
        context.game?.().apply(context, trial.getMove(i));
      }

      // Compute avg for all the playouts.
      for (let j = 0; j < frequencyPlayout.length; j++)
        frequencyPlayouts[j] = (frequencyPlayouts[j] ?? 0) + (frequencyPlayout[j] ?? 0) / turnWithMoves;

      if (prevContext !== null) {
        trial.lastMove().apply(prevContext, true);

        let noEndFound = true;

        const rules = context.rules?.();
        const phases = rules?.phases?.() ?? null;
        if (phases !== null) {
          const mover = context.state?.().mover() ?? 0;
          const phaseIdx = context.state?.().currentPhase(mover) ?? 0;
          const endPhase = phases[phaseIdx] ?? null;
          const EndPhaseRule = endPhase?.end() ?? null;

          if (context.active?.() && EndPhaseRule !== null) {
            const endRules = EndPhaseRule.endRules();
            for (const endingRule of endRules) {
              const endRuleResult = endingRule.eval(prevContext);
              if (endRuleResult === null)
                continue;

              const endConcepts = endingRule.stateConcepts(prevContext);
              noEndFound = false;
              for (let indexConcept = 0; indexConcept < conceptValues.length; indexConcept++) {
                const concept = conceptValues[indexConcept]!;
                if (conceptType(concept) === ConceptType.End && endConcepts.get(conceptId(concept))) {
                  frequencyPlayouts[indexConcept] = (frequencyPlayouts[indexConcept] ?? 0) + 1;
                }
              }
              break;
            }
          }
        }

        const endRule = rules?.end?.() ?? null;
        if (noEndFound && endRule !== null) {
          const endRules = endRule.endRules();
          for (const endingRule of endRules) {
            const endRuleResult = endingRule.eval(prevContext);
            if (endRuleResult === null)
              continue;

            const endConcepts = endingRule.stateConcepts(prevContext);
            noEndFound = false;
            for (let indexConcept = 0; indexConcept < conceptValues.length; indexConcept++) {
              const concept = conceptValues[indexConcept]!;
              if (conceptType(concept) === ConceptType.End && endConcepts.get(conceptId(concept))) {
                frequencyPlayouts[indexConcept] = (frequencyPlayouts[indexConcept] ?? 0) + 1;
              }
            }
            break;
          }
        }

        if (noEndFound) {
          for (let indexConcept = 0; indexConcept < conceptValues.length; indexConcept++) {
            const concept = conceptValues[indexConcept]!;
            if (concept === Concept.Draw) {
              frequencyPlayouts[indexConcept] = (frequencyPlayouts[indexConcept] ?? 0) + 1;
              break;
            }
          }
        }
      }
    }

    // Compute avg frequency for the game.
    for (let i = 0; i < frequencyPlayouts.length; i++)
      frequencyMoveConcepts.push((frequencyPlayouts[i] ?? 0) / trials.length);

    for (let indexConcept = 0; indexConcept < conceptValues.length; indexConcept++) {
      const concept = conceptValues[indexConcept]!;
      const cName = conceptName(concept);
      const freq = frequencyMoveConcepts[indexConcept] ?? 0;
      mapFrequency.set(cName, freq);
      if (freq !== 0) {
        const perc = freq * 100.0;
        console.log("concept = " + cName + " frequency is " + decimalFormat(perc) + "%.");
      }
    }

    const allMilliSecond = Date.now() - startTime;
    const allSeconds2 = allMilliSecond / 1000.0;
    const seconds2 = Math.floor(allSeconds2 % 60.0);
    const minutes2 = Math.floor((allSeconds2 - seconds2) / 60.0);
    const milliSeconds2 = Math.floor(allMilliSecond - (seconds2 * 1000));
    console.log("Frequency done in " + minutes2 + " minutes " + seconds2 + " seconds " + milliSeconds2 + " ms.");

    return mapFrequency;
  }

  // ------------------------------Metrics CONCEPTS-----------------------------------------------------

  /**
   * @param game         The game.
   * @return The map of playout concepts to the their values for the metric ones.
   * @java ExportDbCsvConcepts.metricsConcepts(Game,Evaluation,List)
   */
  private static metricsConcepts(
    game: GameLike,
    evaluation: EvaluationLike,
    reconstructionConcepts: Concept[]
  ): Map<string, number | null> {
    const playoutConceptValues = new Map<string, number | null>();
    // We get the values of the metrics.
    const startTime = Date.now();
    const trialsMetrics: TrialLike[] = trials.slice();
    const rngTrials: RandomProviderStateLike[] = allStoredRNG.slice();

    // We add all the metrics corresponding to a concept to the returned map.
    const metrics = new Evaluation().conceptMetrics() as unknown as MetricLike[];
    for (const metric of metrics) {
      if (metric.concept() !== null) {
        let value: number | null;
        if (reconstructionConcepts.includes(metric.concept()!)) {
          value = metric.apply(game, evaluation, trialsMetrics, rngTrials);
        } else {
          value = null; // If that's not a reconstruction metrics we put NULL for it.
        }

        const cName = conceptName(metric.concept()!);
        if (value === null) {
          playoutConceptValues.set(cName, null);
        } else {
          let metricValue = metric.apply(game, evaluation, trialsMetrics, rngTrials) ?? 0;
          const EPSILON = 1.0e-6;
          metricValue = Math.abs(metricValue) < EPSILON ? 0 : metricValue;
          playoutConceptValues.set(cName, metricValue);
          if (metricValue !== 0)
            console.log(cName + ": " + metricValue);
        }
      }
    }

    const allMilliSecond = Date.now() - startTime;
    const allSeconds2 = allMilliSecond / 1000.0;
    const seconds2 = Math.floor(allSeconds2 % 60.0);
    const minutes2 = Math.floor((allSeconds2 - seconds2) / 60.0);
    const milliSeconds2 = Math.floor(allMilliSecond - (seconds2 * 1000));
    console.log("Metrics done in " + minutes2 + " minutes " + seconds2 + " seconds " + milliSeconds2 + " ms.");

    return playoutConceptValues;
  }

  // ------------------------------Playout Estimation CONCEPTS-----------------------------------------------------

  /**
   * @param game The game.
   * @return The map of playout concepts to the their values for the p/s and m/s ones.
   * @java ExportDbCsvConcepts.playoutsEstimationConcepts(Game)
   */
  private static playoutsEstimationConcepts(game: GameLike): Map<string, number> {
    const playoutConceptValues = new Map<string, number>();
    // Computation of the p/s and m/s
    const startTime = Date.now();

    const context = ExportDbCsvConcepts.createContext(game);

    const warmingUpSecs = 10;
    const measureSecs = 30;

    // Warming up
    let stopAt = 0;
    let start = Date.now();
    const abortAtWarm = start + warmingUpSecs * 1000;
    while (stopAt < abortAtWarm) {
      game.start(context);
      game.playout(context, null, 1.0, null, -1, -1, null);
      stopAt = Date.now();
    }

    // The Test
    stopAt = 0;
    start = Date.now();
    const abortAt = start + measureSecs * 1000;
    let playouts = 0;
    let moveDone = 0;
    while (stopAt < abortAt) {
      game.start(context);
      game.playout(context, null, 1.0, null, -1, -1, null);
      moveDone += context.trial?.().numMoves() ?? 0;
      stopAt = Date.now();
      ++playouts;
    }

    const secs = (stopAt - start) / 1000.0;
    const rate = playouts / secs;
    const rateMove = moveDone / secs;
    playoutConceptValues.set(conceptName(Concept.PlayoutsPerSecond), rate);
    playoutConceptValues.set(conceptName(Concept.MovesPerSecond), rateMove);

    const allSeconds2 = (Date.now() - startTime) / 1000.0;
    const seconds2 = Math.floor(allSeconds2 % 60.0);
    const minutes2 = Math.floor((allSeconds2 - seconds2) / 60.0);
    console.log("p/s = " + rate);
    console.log("m/s = " + rateMove);
    console.log("Playouts/Moves per second estimation done in " + minutes2 + " minutes " + seconds2 + " seconds.");

    return playoutConceptValues;
  }

  // -------------------------------------------------------------------------

  /**
   * Generate all permutations of an array of indices (factorial count).
   * Mirrors Java's ListUtils.generatePermutations.
   */
  private static generatePermutations(arr: number[]): number[][] {
    if (arr.length === 0) return [[]];
    const result: number[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      for (const perm of ExportDbCsvConcepts.generatePermutations(rest)) {
        result.push([arr[i]!, ...perm]);
      }
    }
    return result;
  }

  /**
   * Create a new Context for the given game via globalThis escape hatch
   * (mirrors Java's new Context(game, new Trial(game))).
   */
  private static createContext(game: GameLike): ContextLike {
    const factory = (globalThis as unknown as {
      createContext?: (game: GameLike) => ContextLike
    }).createContext;
    return factory ? factory(game) : ({} as unknown as ContextLike);
  }

  /**
   * Setup a new context with a given RNG state
   * (mirrors Java's Utils.setupNewContext(game, rngState)).
   */
  private static setupNewContext(game: GameLike, rngState: RandomProviderStateLike): ContextLike {
    const factory = (globalThis as unknown as {
      setupNewContext?: (game: GameLike, rng: RandomProviderStateLike) => ContextLike
    }).setupNewContext;
    return factory ? factory(game, rngState) : ({} as unknown as ContextLike);
  }

}

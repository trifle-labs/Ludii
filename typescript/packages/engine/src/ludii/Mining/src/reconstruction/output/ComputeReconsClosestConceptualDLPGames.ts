// @java Mining/src/reconstruction/output/ComputeReconsClosestConceptualDLPGames.java

import { fs } from "../../../../node-shim/fs-lazy.js";
import { FileHandling } from "../../../../Common/src/main/FileHandling.js";
import { StringRoutines } from "../../../../Common/src/main/StringRoutines.js";
import { UnixPrintWriter } from "../../../../Common/src/main/UnixPrintWriter.js";
import { Concept } from "../../../../../ludemes/other/concept/Concept.js";

// Escape-hatch: GameLoader, Compiler not yet ported
type RulesetLike = {
  heading(): string;
  optionSettings(): string[];
};

type GameLike = {
  name(): string;
  description(): { rulesets(): RulesetLike[] | null };
  metadata(): { info(): { getId(): string[] } };
};

// Constants
const INFINITY = Number.MAX_SAFE_INTEGER;
const NULL_VALUE_CONCEPT = -999;

/**
 * @java reconstruction.output.ComputeReconsClosestConceptualDLPGames
 * @author Eric.Piette
 */
export class ComputeReconsClosestConceptualDLPGames {

  // Load ruleset avg common true concepts from specific directory.
  /** @java ComputeReconsClosestConceptualDLPGames.conceptsFilePath */
  static readonly conceptsFilePath: string = "./res/recons/input/RulesetConceptsUCT.csv";

  // The rulesets reconstructed.
  /** @java ComputeReconsClosestConceptualDLPGames.pathReconstructed */
  static readonly pathReconstructed: string    = "./res/recons/output/";

  // The precision of the double to use.
  /** @java ComputeReconsClosestConceptualDLPGames.DOUBLE_PRECISION */
  static readonly DOUBLE_PRECISION: number = 5;

  // Double value used to represented null value concepts.
  /** @java ComputeReconsClosestConceptualDLPGames.NULL_VALUE_CONCEPT */
  static readonly NULL_VALUE_CONCEPT_VAL: number = NULL_VALUE_CONCEPT;

  // Double value used to represented null value concepts.
  /** @java ComputeReconsClosestConceptualDLPGames.output */
  static readonly output: string = "ClosestTop10_And_ExpectedMetricValues.csv";

  //-------------------------------------------------------------------------

  /**
   * Main method.
   *
   * @java ComputeReconsClosestConceptualDLPGames.main(String[])
   */
  public static main(_args: string[]): void {
    ComputeReconsClosestConceptualDLPGames.computeReconsClosest();
  }

  /**
   * Compute the conceptual closest games of all the generated reconstructions.
   *
   * @java ComputeReconsClosestConceptualDLPGames.computeReconsClosest()
   */
  private static computeReconsClosest(): void {
    const reconstructionConcepts: string[] = [
      "DurationTurns",
      "DurationTurnsStdDev",
      "DurationTurnsNotTimeouts",
      "DecisionMoves",
      "BoardCoverageDefault",
      "AdvantageP1",
      "Balance",
      "Completion",
      "Timeouts",
      "Drawishness",
      "PieceNumberAverage",
      "BoardSitesOccupiedAverage",
      "BranchingFactorAverage",
      "DecisionFactorAverage",
    ];

    const gameNames = FileHandling.listGames();

    // Get the CSV.
    console.log("*******Get all concepts from DB*******");
    const rulesetsdIds: number[] = [];
    const conceptIds: number[] = [];
    const conceptValues: number[] = [];
    try {
      const content = fs.readFileSync(ComputeReconsClosestConceptualDLPGames.conceptsFilePath, "utf8");
      const lines = content.split("\n");
      let line = lines.shift() ?? ""; // first line (skip)
      for (const line of lines) {
        if (!line.trim()) continue;
        let lineNoQuote = line.replace(/"/g, "");
        if (lineNoQuote.includes("NULL")) continue;

        let separatorIndex = lineNoQuote.indexOf(',');
        const rulesetName = lineNoQuote.substring(0, separatorIndex);
        lineNoQuote = lineNoQuote.substring(rulesetName.length + 1);

        separatorIndex = lineNoQuote.indexOf(',');
        const idRulesets = lineNoQuote.substring(0, separatorIndex);
        rulesetsdIds.push(parseInt(idRulesets));
        lineNoQuote = lineNoQuote.substring(idRulesets.length + 1);

        separatorIndex = lineNoQuote.indexOf(',');
        const idConcepts = lineNoQuote.substring(0, separatorIndex);
        conceptIds.push(parseInt(idConcepts));
        lineNoQuote = lineNoQuote.substring(idConcepts.length + 1);

        const valuesConcepts = lineNoQuote;
        conceptValues.push(parseFloat(valuesConcepts.length > ComputeReconsClosestConceptualDLPGames.DOUBLE_PRECISION
          ? valuesConcepts.substring(0, ComputeReconsClosestConceptualDLPGames.DOUBLE_PRECISION)
          : valuesConcepts));
      }
    } catch (e) {
      console.error(e);
    }
    console.log("*******Done*******");

    // Get rulesets and ids.
    console.log("*******Get all rulesets names + ids *******");
    const rulesets: string[] = [];
    for (let i = 0; i < 5000; i++)
      rulesets.push("");

    // Escape-hatch: GameLoader not yet ported
    const GameLoader = (globalThis as unknown as { GameLoader?: {
      loadGameFromName(name: string, opts?: string[]): GameLike
    } }).GameLoader;

    // Look at each ruleset.
    for (let index = 0; index < gameNames.length; index++) {
      const gameName = gameNames[index]!;
      if (gameName.replace(/\\/g, "/").includes("/lud/bad/")) continue;
      if (gameName.replace(/\\/g, "/").includes("/lud/wip/")) continue;
      if (gameName.replace(/\\/g, "/").includes("/lud/WishlistDLP/")) continue;
      if (gameName.replace(/\\/g, "/").includes("/lud/test/")) continue;
      if (gameName.replace(/\\/g, "/").includes("subgame")) continue;
      if (gameName.replace(/\\/g, "/").includes("reconstruction/pending")) continue;

      if (!GameLoader) continue;
      const game = GameLoader.loadGameFromName(gameName);
      const rulesetsInGame = game.description().rulesets();

      // Get all the rulesets of the game if it has some.
      if (rulesetsInGame !== null && rulesetsInGame.length > 0) {
        for (let rs = 0; rs < rulesetsInGame.length; rs++) {
          const ruleset = rulesetsInGame[rs]!;
          if (ruleset.optionSettings().length > 0 && !ruleset.heading().includes("Incomplete")) {
            const rulesetGame = GameLoader.loadGameFromName(gameName, ruleset.optionSettings());
            const ids = rulesetGame.metadata().info().getId();
            if (ids.length > 0) {
              const id = parseInt(ids[0]!);
              rulesets[id] = rulesetGame.name() + " " + ruleset.heading();
            }
          }
        }
      } else {
        const ids = game.metadata().info().getId();
        if (ids.length > 0) {
          const id = parseInt(ids[0]!);
          rulesets[id] = game.name();
        }
      }
      if (index % 20 === 0)
        console.log(index + " games checked.");
    }
    console.log("*******Done*******");

    // Gets the concepts for each game in a list.
    console.log("*******Get all concepts values for each id. *******");
    const conceptsPerGame: number[][] = [];
    for (let i = 0; i < rulesets.length; i++) {
      const gameName = rulesets[i]!;
      const gameConcepts: number[] = [];
      const conceptCount = Object.keys(Concept).filter(k => isNaN(Number(k))).length;
      for (let j = 0; j < conceptCount + 1; j++)
        gameConcepts.push(NULL_VALUE_CONCEPT); // -999 just to replace the null values.

      if (gameName.length > 0) {
        const id = i;
        for (let j = 0; j < rulesetsdIds.length; j++)
          if (rulesetsdIds[j] === id) {
            gameConcepts[conceptIds[j]!] = conceptValues[j]!;
          }
      }
      conceptsPerGame.push(gameConcepts);
    }
    console.log("*******Done*******");

    // Compute the 10 closest rulesets for each reconstruction.
    console.log("*******Get all 10 closest rulesets for each reconstruction. *******");
    try {
      const writer = new UnixPrintWriter(ComputeReconsClosestConceptualDLPGames.output);

      // Write Header of the csv.
      const headersToWrite: string[] = [];
      headersToWrite.push("Reconstruction Ruleset");
      for (let i = 0; i < 10; i++)
        headersToWrite.push("closest" + i);
      for (const conceptName of reconstructionConcepts) {
        headersToWrite.push(conceptName + "_Expected");
        headersToWrite.push(conceptName + "_Current");
      }
      writer.printlnStr(StringRoutines.join(",", headersToWrite));

      for (let i = 0; i < rulesets.length; i++) {
        const rulesetName = rulesets[i]!;
        if (rulesetName.includes("Reconstructed")) {
          const gameConceptsReconstructed = conceptsPerGame[i]!;
          const top10Distance: number[] = [];
          const top10Closest: string[][] = [];
          const top10Ids: number[][] = [];
          for (let j = 0; j < 10; j++) {
            top10Distance.push(INFINITY * -1);
            top10Closest.push([]);
            top10Ids.push([]);
          }

          // Check all other rulesets...
          for (let j = 0; j < rulesets.length; j++) {
            // ... which are not reconstructed.
            if (!rulesets[j]!.includes("Reconstructed")) {
              const gameConceptsNotReconstructed = conceptsPerGame[j]!;

              // Compute Distance.
              let distance = 0;
              for (let k = 0; k < gameConceptsReconstructed.length; k++) {
                const conceptValueReconstructed = gameConceptsReconstructed[k]!;
                const conceptValueNotReconstructed = gameConceptsNotReconstructed[k]!;
                if (conceptValueReconstructed !== NULL_VALUE_CONCEPT && conceptValueNotReconstructed !== NULL_VALUE_CONCEPT) {
                  if (conceptValueReconstructed === conceptValueNotReconstructed)
                    distance++;
                  else
                    distance--;
                }
              }

              // Check if we already have this distance.
              let newDistance = true;
              for (let k = 0; k < top10Distance.length; k++) {
                if (distance === top10Distance[k]) {
                  top10Closest[k]!.push(rulesets[j]!);
                  top10Ids[k]!.push(j);
                  newDistance = false;
                  break;
                }
              }

              if (newDistance) {
                // Get minimum current distance.
                let min = top10Distance[0]!;
                let indexMin = 0;
                for (let k = 1; k < top10Distance.length; k++) {
                  if (min > top10Distance[k]!) {
                    min = top10Distance[k]!;
                    indexMin = k;
                  }
                }

                // Check if the min is lower than new distance to add it.
                if (distance > top10Distance[indexMin]!) {
                  top10Distance[indexMin] = distance;
                  top10Closest[indexMin]!.length = 0;
                  top10Closest[indexMin]!.push(rulesets[j]!);
                  top10Ids[indexMin]!.length = 0;
                  top10Ids[indexMin]!.push(j);
                }
              }
            }
          }

          console.log("***For " + rulesetName + " ***");
          console.log("10 closest rulesets are: ");
          for (let j = 0; j < top10Closest.length; j++)
            console.log("Distance = " + top10Distance[j] + " RULESET = " + top10Closest[j]);
          console.log();

          // Write results in the csv.
          const lineToWrite: string[] = [];
          lineToWrite.push(rulesetName);
          for (const closestGames of top10Closest)
            if (closestGames.length > 0)
              lineToWrite.push(closestGames[0]!);
            else
              lineToWrite.push("");

          const conceptNames = Object.keys(Concept).filter(k => isNaN(Number(k)));
          for (const conceptName of reconstructionConcepts) {
            const idConcept = conceptNames.indexOf(conceptName);
            let sumValues = 0;
            let numValues = 0;
            for (let j = 0; j < top10Ids.length; j++) {
              const ids = top10Ids[j]!;
              for (let k = 0; k < ids.length; k++) {
                numValues++;
                sumValues += conceptsPerGame[ids[k]!]![idConcept] ?? 0;
              }
            }
            const averageValue = sumValues / numValues;

            console.log("For concept " + conceptName);
            console.log("Average expected value is " + averageValue);
            console.log("Current Value is " + gameConceptsReconstructed[idConcept]);
            console.log();

            lineToWrite.push(averageValue + "");
            lineToWrite.push((gameConceptsReconstructed[idConcept] ?? NULL_VALUE_CONCEPT) + "");
          }

          writer.printlnStr(StringRoutines.join(",", lineToWrite));

          console.log("\n********************************************************\n");
        }
      }

      const content = writer.flush();
      fs.writeFileSync(ComputeReconsClosestConceptualDLPGames.output, content, "utf8");
    } catch (e) {
      console.error(e);
    }

    console.log("*******Done*******");
  }
}

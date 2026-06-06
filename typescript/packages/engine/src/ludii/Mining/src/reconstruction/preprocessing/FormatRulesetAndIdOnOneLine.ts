// @java Mining/src/reconstruction/preprocessing/FormatRulesetAndIdOnOneLine.java

/**
 * Format all the complete ruleset descriptions on a single line and place them in a CSV.
 *
 * @java reconstruction/preprocessing/FormatRulesetAndIdOnOneLine.java
 * @author Eric.Piette
 */

import { FileHandling } from "../../../../Common/src/main/FileHandling.js";
import { StringRoutines } from "../../../../Common/src/main/StringRoutines.js";
import { UnixPrintWriter } from "../../../../Common/src/main/UnixPrintWriter.js";
import { Ruleset } from "../../../../Common/src/main/options/Ruleset.js";

// Escape-hatch types for not-yet-ported dependencies

/** @java game.Game */
interface GameLike {
  name(): string;
  description(): DescriptionLike;
  metadata(): MetadataLike;
  getRuleset(): RulesetHeading;
  booleanConcepts(): { get(id: number): boolean };
}

interface DescriptionLike {
  rulesets(): Ruleset[] | null;
  expanded(): string;
}

interface MetadataLike {
  info(): InfoLike;
}

interface InfoLike {
  getId(): string[];
}

interface RulesetHeading {
  heading(): string;
  optionSettings(): string[];
}

/** @java other.GameLoader */
const GameLoader = {
  loadGameFromName(_name: string, _options?: unknown): GameLike {
    throw new Error("GameLoader.loadGameFromName: not implemented in TS runtime");
  },
} as unknown as {
  loadGameFromName(name: string, options?: unknown): GameLike;
};

/**
 * Format all the complete ruleset descriptions on a single line and place them in a CSV.
 *
 * @java reconstruction/preprocessing/FormatRulesetAndIdOnOneLine.java
 */
export class FormatRulesetAndIdOnOneLine {

  //-------------------------------------------------------------------------

  /**
   * Generate the CSVs
   * @java FormatRulesetAndIdOnOneLine.generateCSV()
   */
  public static generateCSV(): void {
    const gameNames: string[] = FileHandling.listGames();
    const output = "RulesetFormatted.csv";

    // Java: new UnixPrintWriter(new File(output), "UTF-8") — TS has single-arg constructor
    const writer = new UnixPrintWriter(output);

    try {
      // Look at each ruleset.
      for (let index = 0; index < gameNames.length; index++) {
        const gameName: string = gameNames[index] ?? "";

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

        if (gameName.replace(/\\/g, "/").includes("reconstruction"))
          continue;

        const game: GameLike = GameLoader.loadGameFromName(gameName);
        const rulesetsInGame: Ruleset[] | null = game.description().rulesets();

        // Get all the rulesets of the game if it has some.
        if (rulesetsInGame !== null && rulesetsInGame.length > 0) {
          for (let rs = 0; rs < rulesetsInGame.length; rs++) {
            const ruleset: Ruleset = rulesetsInGame[rs] as Ruleset;
            if (ruleset.optionSettings().length > 0) {
              // We check if the ruleset is implemented.
              const rulesetGame: GameLike = GameLoader.loadGameFromName(gameName, ruleset.optionSettings());
              const ids: string[] = rulesetGame.metadata().info().getId();
              if (ids.length > 0) {
                const rulesetId: string = ids[0] ?? "";
                console.log("Game: " + game.name() + " RulesetName = " + rulesetGame.getRuleset().heading() + " RulesetID = " + rulesetId);

                const formattedDesc: string = StringRoutines.formatOneLineDesc(rulesetGame.description().expanded());
                const lineToWrite: string[] = [];
                lineToWrite.push(game.name());
                lineToWrite.push(rulesetGame.getRuleset().heading());
                lineToWrite.push(rulesetId);
                lineToWrite.push(formattedDesc);
                writer.printlnStr(StringRoutines.join(",", lineToWrite));
              }
            }
          }
        } else {
          const ids: string[] = game.metadata().info().getId();
          if (ids.length > 0) {
            const rulesetId: string = ids[0] ?? "";
            console.log("Game: " + game.name() + " RulesetID = " + rulesetId);

            const formattedDesc: string = StringRoutines.formatOneLineDesc(game.description().expanded());
            const lineToWrite: string[] = [];
            lineToWrite.push(game.name());
            lineToWrite.push("ONLY ONE RULESET");
            lineToWrite.push(rulesetId);
            lineToWrite.push(formattedDesc);
            writer.printlnStr(StringRoutines.join(",", lineToWrite));
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    console.log("RulesetFormatted CSV generated");
  }

  //-------------------------------------------------------------------------
}

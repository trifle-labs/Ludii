// @java Mining/src/reconstruction/output/UpdateGameRulesetsTable.java

import * as fs from "fs";
import { StringRoutines } from "../../../../Common/src/main/StringRoutines.js";
import { UnixPrintWriter } from "../../../../Common/src/main/UnixPrintWriter.js";
import { FileHandling } from "../../../../Common/src/main/FileHandling.js";

// Escape-hatch: Compiler not yet ported
type DescriptionLike = {
  raw(): string;
  expanded(): string;
  setExpanded(s: string): void;
  defineInstances(): unknown;
};

// Escape-hatch: GameLike not yet ported
type GameLike = {
  toEnglish(game: GameLike): string;
};

// Constants
const UNDEFINED = -1;

/**
 * To generate the new lines to add to GameRulesets Table with the outcome
 * rulesets from the reconstruction process.
 *
 * @java reconstruction.output.UpdateGameRulesetsTable
 * @author Eric.Piette
 */
export class UpdateGameRulesetsTable {

  // Load ruleset avg common true concepts from specific directory.
  /** @java UpdateGameRulesetsTable.gameRulesetsFilePath */
  static readonly gameRulesetsFilePath: string = "./res/recons/input/GameRulesets.csv";

  // The rulesets reconstructed.
  /** @java UpdateGameRulesetsTable.pathReconstructed */
  static readonly pathReconstructed: string    = "./res/recons/output/";

  // The game name.
  /** @java UpdateGameRulesetsTable.gameName */
  static readonly gameName: string        = "Lupo e Pecore";

  // The precision of the double to use.
  /** @java UpdateGameRulesetsTable.DOUBLE_PRECISION */
  static readonly DOUBLE_PRECISION: number = 5;

  //-------------------------------------------------------------------------

  /**
   * Main method.
   *
   * @java UpdateGameRulesetsTable.main(String[])
   */
  public static main(_args: string[]): void {
    const nextId = 1 + UpdateGameRulesetsTable.getMaxId();
    UpdateGameRulesetsTable.updateGameRulesets(nextId);
  }

  /**
   * Generate the new lines to add to GameRulesets.csv with the new rulesets.
   *
   * @param nextId The next id to use.
   * @java UpdateGameRulesetsTable.updateGameRulesets(int)
   */
  private static updateGameRulesets(nextId: number): void {
    const pathReportReconstrution = UpdateGameRulesetsTable.pathReconstructed + UpdateGameRulesetsTable.gameName + ".csv";
    const pathFolderReconstrutions = UpdateGameRulesetsTable.pathReconstructed + UpdateGameRulesetsTable.gameName + "/";

    const rulesetNameList: string[] = [];
    const idReconsList: number[] = [];
    const scoreList: number[] = [];
    const similaryScoreList: number[] = [];
    const conceptualScoreList: number[] = [];
    const geographicalScoreList: number[] = [];
    const idsUsedList: string[] = [];
    const otherIdsList: string[] = [];
    const toEnglishList: string[] = [];

    try {
      const content = fs.readFileSync(pathReportReconstrution, "utf8");
      const lines = content.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        let lineNoQuote = line.replace(/"/g, "");

        let separatorIndex = lineNoQuote.indexOf(',');
        const rulesetName = lineNoQuote.substring(0, separatorIndex);
        lineNoQuote = lineNoQuote.substring(rulesetName.length + 1);
        rulesetNameList.push(rulesetName);

        separatorIndex = lineNoQuote.indexOf(',');
        const idReconsStr = lineNoQuote.substring(0, separatorIndex);
        idReconsList.push(parseInt(idReconsStr));

        lineNoQuote = lineNoQuote.substring(idReconsStr.length + 1);
        separatorIndex = lineNoQuote.indexOf(',');
        let scoreStr = lineNoQuote.substring(0, separatorIndex);
        scoreList.push(parseFloat(scoreStr.length > UpdateGameRulesetsTable.DOUBLE_PRECISION ? scoreStr.substring(0, UpdateGameRulesetsTable.DOUBLE_PRECISION) : scoreStr));

        lineNoQuote = lineNoQuote.substring(scoreStr.length + 1);
        separatorIndex = lineNoQuote.indexOf(',');
        let similarityScoreStr = lineNoQuote.substring(0, separatorIndex);
        similaryScoreList.push(parseFloat(similarityScoreStr.length > UpdateGameRulesetsTable.DOUBLE_PRECISION ? similarityScoreStr.substring(0, UpdateGameRulesetsTable.DOUBLE_PRECISION) : similarityScoreStr));

        lineNoQuote = lineNoQuote.substring(similarityScoreStr.length + 1);
        separatorIndex = lineNoQuote.indexOf(',');
        let culturalScoreStr = lineNoQuote.substring(0, separatorIndex);
        conceptualScoreList.push(parseFloat(culturalScoreStr.length > UpdateGameRulesetsTable.DOUBLE_PRECISION ? culturalScoreStr.substring(0, UpdateGameRulesetsTable.DOUBLE_PRECISION) : culturalScoreStr));

        lineNoQuote = lineNoQuote.substring(culturalScoreStr.length + 1);
        separatorIndex = lineNoQuote.indexOf(',');
        let geographicalScoreStr = lineNoQuote.substring(0, separatorIndex);
        geographicalScoreList.push(parseFloat(geographicalScoreStr.length > UpdateGameRulesetsTable.DOUBLE_PRECISION ? geographicalScoreStr.substring(0, UpdateGameRulesetsTable.DOUBLE_PRECISION) : geographicalScoreStr));

        lineNoQuote = lineNoQuote.substring(geographicalScoreStr.length + 1);
        separatorIndex = lineNoQuote.indexOf('}') + 1;
        const ids = lineNoQuote.substring(1, separatorIndex - 1);
        idsUsedList.push(ids);

        lineNoQuote = lineNoQuote.substring(ids.length + 3);
        const otherIds = lineNoQuote.substring(0, lineNoQuote.length);
        otherIdsList.push(otherIds);

        const pathReconstruction = pathFolderReconstrutions + rulesetName + ".lud";
        const desc = FileHandling.loadTextContentsFromFile(pathReconstruction);

        // Escape-hatch: Compiler.compileTest not yet ported
        const Compiler = (globalThis as unknown as { Compiler?: {
          compileTest(description: DescriptionLike, verbose: boolean): GameLike | null
        } }).Compiler;
        let toEnglish = "";
        if (Compiler) {
          const tempDesc: DescriptionLike = {
            raw: () => desc,
            expanded: () => desc,
            setExpanded(_s: string) { /* noop */ },
            defineInstances: () => null,
          };
          const game = Compiler.compileTest(tempDesc, false);
          if (game)
            toEnglish = game.toEnglish(game);
        }
        toEnglishList.push(toEnglish);
      }
    } catch (e) {
      console.error(e);
    }

    const output = "GameRulesets.csv";

    // Write the new CSV.
    try {
      const writer = new UnixPrintWriter(output);
      for (let i = 0; i < rulesetNameList.length; i++) {
        const lineToWrite: string[] = [];
        lineToWrite.push('"' + (nextId + i) + '"');
        lineToWrite.push('"' + UpdateGameRulesetsTable.getGameReconsId(idReconsList[i]!) + '"');
        lineToWrite.push('"' + rulesetNameList[i] + '"');
        lineToWrite.push("NULL");
        lineToWrite.push('"Reconstructed with Ludii"');
        lineToWrite.push('"2"');
        lineToWrite.push("NULL");
        lineToWrite.push('"' + toEnglishList[i] + '"');
        lineToWrite.push("NULL");
        lineToWrite.push("NULL");
        lineToWrite.push("NULL");
        lineToWrite.push("NULL");
        lineToWrite.push("NULL");
        lineToWrite.push("NULL");
        lineToWrite.push("NULL");
        lineToWrite.push('"0"');
        lineToWrite.push("NULL");
        lineToWrite.push('"0"');
        lineToWrite.push('"0"');
        lineToWrite.push('"' + scoreList[i] + '"');
        lineToWrite.push('"' + similaryScoreList[i] + '"');
        lineToWrite.push('"' + conceptualScoreList[i] + '"');
        lineToWrite.push('"' + geographicalScoreList[i] + '"');
        lineToWrite.push('"' + idsUsedList[i] + '"');
        lineToWrite.push('"' + otherIdsList[i] + '"');
        writer.printlnStr(StringRoutines.join(",", lineToWrite));
      }
      const content = writer.flush();
      fs.writeFileSync(output, content, "utf8");
    } catch (e) {
      console.error(e);
    }

    console.log("GameRulesets CSV Updated");
  }

  /**
   * @return the max id of the rulesets
   * @java UpdateGameRulesetsTable.getMaxId()
   */
  private static getMaxId(): number {
    // ids of the rulesets
    const ids: number[] = [];

    try {
      const content = fs.readFileSync(UpdateGameRulesetsTable.gameRulesetsFilePath, "utf8");
      const lines = content.split("\n");
      for (const line of lines) {
        if (line.length > 2 && line.charAt(0) === '"' && /\d/.test(line.charAt(1))) {
          const subLine = line.substring(1);
          let ii = 0;
          let c = subLine.charAt(ii);
          while (c !== '"') {
            ii++;
            c = subLine.charAt(ii);
          }
          ids.push(parseInt(subLine.substring(0, ii)));
        }
      }
    } catch (e) {
      console.error(e);
    }

    return ids.length > 0 ? Math.max(...ids) : 0;
  }

  /**
   * @return the id of the game to recons.
   * @java UpdateGameRulesetsTable.getGameReconsId(int)
   */
  private static getGameReconsId(reconsRulesetId: number): number {
    try {
      const content = fs.readFileSync(UpdateGameRulesetsTable.gameRulesetsFilePath, "utf8");
      const lines = content.split("\n");
      for (const line of lines) {
        if (line.length > 2 && line.charAt(0) === '"' && /\d/.test(line.charAt(1))) {
          let subLine = line.substring(1);
          let ii = 0;
          let c = subLine.charAt(ii);
          while (c !== '"') {
            ii++;
            c = subLine.charAt(ii);
          }
          const rulesetId = parseInt(subLine.substring(0, ii));
          if (rulesetId === reconsRulesetId) {
            subLine = subLine.substring(ii + 3);
            ii = 0;
            c = subLine.charAt(ii);
            while (c !== '"') {
              ii++;
              c = subLine.charAt(ii);
            }
            return parseInt(subLine.substring(0, ii));
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    return UNDEFINED;
  }
}

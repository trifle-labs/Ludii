// @java Mining/src/utils/bgg/Database.java

/**
 * BGG database utilities.
 *
 * @java utils/bgg/Database.java
 */

import { BggData } from "./BggData.js";
import { BggGame } from "./BggGame.js";
import { Recommender } from "./Recommender.js";

// Not-yet-ported dependency
type AliasesDataLike = {
  aliasesForGameName: (name: string) => string[] | null;
};

/** @java Database */
export class Database {
  /** valid game Ids for the recommendation process — @java Database.validGameIds */
  private static readonly _validGameIds: number[] = [];

  //-------------------------------------------------------------------------

  /**
   * Populates the validGameIds list with all BGGIds associated with Ludii games.
   *
   * @java Database.saveValidGameIds(String)
   */
  public static saveValidGameIds(dbGamesFilePath: string): void {
    const FS = (globalThis as unknown as { FS: { readFileSync: (p: string, enc: string) => string } }).FS;
    if (!FS) return;

    try {
      const content = FS.readFileSync(dbGamesFilePath, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        try {
          const parts = line.split(",");
          if (parts.length < 2) continue;
          const gameId = parseInt((parts[1] ?? "").trim().toLowerCase().replace(/"/g, ""), 10);
          if (!isNaN(gameId)) {
            Database._validGameIds.push(gameId);
          }
        } catch (e) {
          // probably null
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Finds BGGId or recommended games for all game names in Games.csv.
   *
   * @java Database.findDBGameMatches(BggData, boolean, String, String)
   */
  public static findDBGameMatches(
    data: BggData,
    getRecommendations: boolean,
    dbGamesFilePath: string,
    outputFilePath: string
  ): void {
    const FS = (globalThis as unknown as {
      FS: {
        readFileSync: (p: string, enc: string) => string;
        writeFileSync: (p: string, d: string) => void;
      }
    }).FS;

    const AliasesData = (globalThis as unknown as {
      AliasesData: { loadData: () => AliasesDataLike }
    }).AliasesData;

    let outputString = "";

    try {
      const content = FS.readFileSync(dbGamesFilePath, "utf-8");
      const lines = content.split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;

        // Read in the DB data from csv.
        const parts = line.split(",");
        const gameName = (parts[0] ?? "").trim().replace(/"/g, "");
        const bggIdString = (line.trim().split(",")[1] ?? "").replace(/"/g, "");
        let game: BggGame | null = null;

        // Try to find the matching entry for each game in BGG
        if (bggIdString !== "NULL") {
          const id = parseInt(bggIdString, 10);
          game = data.gamesByBggId().get(id) ?? null;
        } else {
          // load in the aliases for this game
          const aliases: string[] = [];
          aliases.push(gameName.toLowerCase());
          const aliasesData = AliasesData.loadData();
          const loadedAliases = aliasesData.aliasesForGameName(gameName);
          if (loadedAliases !== null) {
            for (const alias of loadedAliases) {
              aliases.push(alias);
            }
          }

          for (const name of aliases) {
            const tempGame = Recommender.findGame(data, name, "", true, true);
            if (tempGame !== null) {
              game = tempGame;
              break;
            }
          }
        }

        if (game !== null) {
          if (getRecommendations) {
            // Give a set of recommended games
            process.stdout.write(gameName + ": ");
            Recommender.ratingSimilarityRecommendFor(data, String(game.bggId()), "");
          } else {
            // Give BGGID
            const outputLine = gameName.replace(/ /g, "_") + ", " + game.bggId() + ", " + game.averageRating();
            console.log(outputLine);
            outputString += outputLine + "\n";
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Save results in output file
    try {
      FS.writeFileSync(outputFilePath, "Name,BGGId,AverageRating\n" + outputString);
    } catch (e) {
      console.error(e);
    }
  }

  //-------------------------------------------------------------------------

  /** @java Database.validGameIds() */
  public static validGameIds(): number[] {
    return Database._validGameIds;
  }

  //-------------------------------------------------------------------------
}

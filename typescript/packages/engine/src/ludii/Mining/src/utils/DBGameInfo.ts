// @java Mining/src/utils/DBGameInfo.java

/**
 * Gets the unique name representation for a given game object (including ruleset name).
 *
 * @java utils/DBGameInfo.java
 * @author Matthew.Stephenson
 */

// Not-yet-ported dependency — escape-hatch interface
type RulesetLike = { heading: () => string };
type GameDescriptionLike = { rulesets: () => RulesetLike[] | null };
type GameLike = {
  name: () => string;
  getRuleset: () => RulesetLike | null;
  description: () => GameDescriptionLike;
};

/** @java DBGameInfo */
export class DBGameInfo {
  /**
   * SQL command to update this file located in the same directory.
   *
   * @java DBGameInfo.rulesetIdsInputFilePath
   */
  private static rulesetIdsInputFilePath = "./res/concepts/input/GameRulesets.csv";

  /**
   * Cached version of ruleset-Id information.
   *
   * @java DBGameInfo.rulesetIds
   */
  private static rulesetIds: Map<string, number> | null = null;

  //-------------------------------------------------------------------------

  /**
   * @param game
   * @return the unique name representation for a given game object (including ruleset name).
   *
   * @java DBGameInfo.getUniqueName(Game)
   */
  public static getUniqueName(game: GameLike): string {
    const gameName = game.name();
    let rulesetName = "";
    const ruleset = game.getRuleset();
    if (ruleset !== null && game.description().rulesets() !== null && (game.description().rulesets()?.length ?? 0) > 1) {
      const startString = "Ruleset/";
      const heading = ruleset.heading();
      rulesetName = heading.substring(startString.length, heading.lastIndexOf("(") - 1);
    }

    let gameRulesetName = gameName + "-" + rulesetName;
    gameRulesetName = gameRulesetName.replace(/ /g, "_").replace(/["',()]/g, "");

    return gameRulesetName;
  }

  //-------------------------------------------------------------------------

  /** @java DBGameInfo.getRulesetIds() */
  public static getRulesetIds(): Map<string, number> {
    return DBGameInfo.getRulesetIdsFromPath(DBGameInfo.rulesetIdsInputFilePath);
  }

  /**
   * @return a Map giving the DB Id for each ruleset in the database
   *
   * @java DBGameInfo.getRulesetIds(String)
   */
  public static getRulesetIdsFromPath(filePath: string): Map<string, number> {
    if (DBGameInfo.rulesetIds === null) {
      const rulesetNameIdPairs = new Map<string, number>();

      const FS = (globalThis as unknown as {
        FS: { readFileSync: (p: string, enc: string) => string }
      }).FS;

      const allLines: string[][] = [];

      try {
        const content = FS.readFileSync(filePath, "utf-8");
        for (const line of content.split("\n")) {
          if (!line.trim()) continue;
          const values = line.split(",");
          allLines.push(values);
        }
      } catch (e) {
        console.error(e);
      }

      for (const line of allLines) {
        const gameNameEntry = line[0] ?? "";
        const rulesetNameEntry = line[1] ?? "";
        const Id = parseInt((line[2] ?? "").replace(/"/g, ""), 10);

        // If game name occurs more than once, then add ruleset name.
        let gameCounter = 0;
        for (const checkLine of allLines) {
          if (checkLine[0] === gameNameEntry) gameCounter++;
        }

        let gameRulesetName = gameNameEntry + "-";
        if (gameCounter > 1) {
          gameRulesetName = gameNameEntry + "-" + rulesetNameEntry;
        }

        gameRulesetName = gameRulesetName.replace(/ /g, "_").replace(/["',()]/g, "");

        rulesetNameIdPairs.set(gameRulesetName, Id);
      }

      DBGameInfo.rulesetIds = rulesetNameIdPairs;
    }

    return DBGameInfo.rulesetIds;
  }

  //-------------------------------------------------------------------------

  /**
   * @return The DB Id for the ruleset in the database corresponding to a given Game object.
   *
   * @java DBGameInfo.getRulesetId(Game)
   */
  public static getRulesetId(game: GameLike): number | undefined {
    return DBGameInfo.getRulesetIds().get(DBGameInfo.getUniqueName(game));
  }

  //-------------------------------------------------------------------------
}

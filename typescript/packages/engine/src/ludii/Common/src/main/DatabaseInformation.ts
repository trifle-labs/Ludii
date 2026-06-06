// @java Common/src/main/DatabaseInformation.java

/**
 * Database information utilities for game and ruleset IDs.
 *
 * @java main/DatabaseInformation.java
 */
export class DatabaseInformation {
  // -------------------------------------------------------------------------

  /** @java DatabaseInformation.RESOURCE_PATH */
  private static readonly RESOURCE_PATH = "/help/GameRulesets.csv";

  // -------------------------------------------------------------------------

  /**
   * @param rulesetHeading The heading of the ruleset.
   * @return the database name for a given ruleset.
   *
   * @java DatabaseInformation.getRulesetDBName(String)
   */
  public static getRulesetDBName(rulesetHeading: string): string {
    try {
      const rulesetNameArray = rulesetHeading.split(/[/(]/);
      let rulesetNameString = "";
      for (let i = 1; i < rulesetNameArray.length - 1; i++) {
        rulesetNameString += rulesetNameArray[i] + "(";
      }
      rulesetNameString = rulesetNameString.substring(0, rulesetNameString.length - 1);
      return rulesetNameString.trim();
    } catch (_e) {
      return rulesetHeading;
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @param gameName
   * @param rulesetName
   * @return the database Id for a given ruleset, or -1 if not found.
   *
   * @java DatabaseInformation.getRulesetId(String, String)
   */
  public static getRulesetId(
    gameName: string,
    rulesetName: string,
    csvText: string
  ): number {
    try {
      const allRulesetIdsForGame: number[] = [];

      for (const line of csvText.split("\n")) {
        const trimmed = line.trimEnd();
        if (trimmed.length === 0) continue;

        const lineArray = trimmed.replace(/"/g, "").split(",");

        if (lineArray[1] === gameName) {
          allRulesetIdsForGame.push(parseInt(lineArray[2]!, 10));

          if (
            lineArray[3] === rulesetName ||
            lineArray[3] === DatabaseInformation.getRulesetDBName(rulesetName)
          ) {
            return parseInt(lineArray[2]!, 10);
          }
        }
      }

      // Check if there is only one ruleset for this game.
      if (rulesetName.length === 0 && allRulesetIdsForGame.length === 1) {
        return allRulesetIdsForGame[0]!;
      }
    } catch (_e) {
      // ignore
    }

    return -1;
  }

  // -------------------------------------------------------------------------

  /**
   * @param gameName
   * @return the database Id for a given game, or -1 if not found.
   *
   * @java DatabaseInformation.getGameId(String)
   */
  public static getGameId(gameName: string, csvText: string): number {
    try {
      for (const line of csvText.split("\n")) {
        const trimmed = line.trimEnd();
        if (trimmed.length === 0) continue;

        const lineArray = trimmed.replace(/"/g, "").split(",");

        if (lineArray[1] === gameName) {
          return parseInt(lineArray[0]!, 10);
        }
      }
    } catch (_e) {
      // ignore
    }

    return -1;
  }

  // -------------------------------------------------------------------------
}

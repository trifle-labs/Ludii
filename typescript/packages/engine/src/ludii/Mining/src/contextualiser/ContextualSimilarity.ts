// @java Mining/src/contextualiser/ContextualSimilarity.java

import * as fs from "fs";

/**
 * @java contextualiser.ContextualSimilarity
 */

// Not-yet-ported dependency escape-hatch interfaces
type RulesetLike = { heading: () => string };
type GameLike = {
  name: () => string;
  getRuleset: () => RulesetLike | null;
  description: () => { rulesets: () => RulesetLike[] | null };
};

// Inline DBGameInfo.getUniqueName and DBGameInfo.getRulesetIds since DBGameInfo is not yet ported
function getUniqueName(game: GameLike): string {
  const gameName = game.name();
  let rulesetName = "";
  const ruleset = game.getRuleset();
  const rulesets = game.description().rulesets();
  if (ruleset !== null && rulesets !== null && rulesets.length > 1) {
    const startString = "Ruleset/";
    const heading = ruleset.heading();
    rulesetName = heading.substring(startString.length, heading.lastIndexOf("(") - 1);
  }
  let gameRulesetName = gameName + "-" + rulesetName;
  gameRulesetName = gameRulesetName.replace(/ /g, "_").replace(/["',()]/g, "");
  return gameRulesetName;
}

function getRulesetIds(filePath: string): Map<string, number> {
  const rulesetIds = new Map<string, number>();
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      if (line.trim().length === 0) continue;
      const values = line.split(",");
      const name = values[0]?.replace(/"/g, "") ?? "";
      const idStr = values[values.length - 1]?.trim() ?? "";
      const id = parseInt(idStr, 10);
      if (!isNaN(id)) {
        rulesetIds.set(name, id);
      }
    }
  } catch (_e) {
    // file not found or parse error
  }
  return rulesetIds;
}

/** @java ContextualSimilarity */
export class ContextualSimilarity {

  //-------------------------------------------------------------------------

  /** @java ContextualSimilarity.rulesetIdsFilePath */
  public static readonly rulesetIdsFilePath: string =
    "../Mining/res/concepts/input/GameRulesets.csv";

  /** @java ContextualSimilarity.rulesetContextualiserFilePath */
  public static readonly rulesetContextualiserFilePath: string =
    "../Mining/res/recons/input/contextualiser_1000/similarity_";

  /** @java ContextualSimilarity.rulesetGeographicDistanceFilePath */
  public static readonly rulesetGeographicDistanceFilePath: string =
    "../Mining/res/recons/input/rulesetGeographicalDistances.csv";

  /** @java ContextualSimilarity.rulesetYearDistanceFilePath */
  public static readonly rulesetYearDistanceFilePath: string =
    "../Mining/res/recons/input/rulesetYearDistances.csv";

  //-------------------------------------------------------------------------

  /**
   * @param game Game to compare similarity against.
   * @param conceptSimilarity true if using concept similarity, otherwise using cultural similarity.
   * @return Map of game/ruleset names to similarity values.
   * @java ContextualSimilarity.getRulesetSimilarities(Game, boolean)
   */
  public static getRulesetSimilarities(
    game: GameLike,
    conceptSimilarity: boolean
  ): Map<string, number> {
    // Get all ruleset ids from DB
    const name = getUniqueName(game);
    const rulesetIds = getRulesetIds(ContextualSimilarity.rulesetIdsFilePath);
    const rulesetId = rulesetIds.get(name) ?? -1;

    const rulesetSimilaritiesIds = new Map<number, number>();        // Map of ruleset ids to similarity
    const rulesetSimilaritiesNames = new Map<string, number>();       // Map of game/ruleset names to similarity
    const fileName =
      ContextualSimilarity.rulesetContextualiserFilePath + rulesetId + ".csv";

    try {
      const content = fs.readFileSync(fileName, "utf-8");
      const lines = content.split("\n");
      // Skip first line of column headers.
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined || line.trim().length === 0) continue;
        const values = line.split(",");

        let similarity = -1.0;
        if (conceptSimilarity)
          similarity = parseFloat(values[2] ?? "0");
        else
          similarity = parseFloat(values[1] ?? "0");

        const id0 = parseInt(values[0] ?? "0", 10);
        rulesetSimilaritiesIds.set(id0, similarity);

        if (!Array.from(rulesetIds.values()).includes(id0))
          console.log(
            "ERROR, two rulesets with the same name. ruleset id: " + id0
          );

        // Convert ruleset ids to corresponding names.
        for (const [entryKey, entryValue] of rulesetIds.entries())
          if (entryValue === id0)
            rulesetSimilaritiesNames.set(entryKey, similarity);
      }
    } catch (e) {
      console.log(
        "Could not find similarity file, ruleset probably has no evidence."
      );
      console.error(e);
    }

    return rulesetSimilaritiesNames;
  }

  //-------------------------------------------------------------------------

  /**
   * @param game Game to compare geographic similarity against.
   * @return Map of game/ruleset names to similarity values.
   * @java ContextualSimilarity.getRulesetGeographicSimilarities(Game)
   */
  public static getRulesetGeographicSimilarities(
    game: GameLike
  ): Map<string, number> {
    // Get all ruleset ids from DB
    const name = getUniqueName(game);
    const rulesetIds = getRulesetIds(ContextualSimilarity.rulesetIdsFilePath);
    const rulesetId = rulesetIds.get(name) ?? -1;

    const rulesetSimilaritiesIds = new Map<number, number>();        // Map of ruleset ids to similarity
    const rulesetSimilaritiesNames = new Map<string, number>();       // Map of game/ruleset names to similarity

    try {
      const content = fs.readFileSync(
        ContextualSimilarity.rulesetGeographicDistanceFilePath,
        "utf-8"
      );
      const lines = content.split("\n");
      // Skip first line of column headers.
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined || line.trim().length === 0) continue;
        const values = line.split(",");

        const id0 = parseInt(values[0] ?? "0", 10);
        if (id0 !== rulesetId)
          continue;

        const id1 = parseInt(values[1] ?? "0", 10);
        const dist2 = parseFloat(values[2] ?? "0");
        const similarity = Math.max((20000 - dist2) / 20000, 0); // 20000km is the maximum possible distance
        rulesetSimilaritiesIds.set(id1, similarity);

        if (!Array.from(rulesetIds.values()).includes(id0))
          console.log(
            "ERROR, two rulesets with the same name. ruleset id: " + id0
          );

        // Convert ruleset ids to corresponding names.
        for (const [entryKey, entryValue] of rulesetIds.entries())
          if (entryValue === id1)
            rulesetSimilaritiesNames.set(entryKey, similarity);
      }
    } catch (e) {
      console.log(
        "Could not find similarity file, ruleset probably has no evidence."
      );
      console.error(e);
    }

    return rulesetSimilaritiesNames;
  }

  //-------------------------------------------------------------------------

  /**
   * @param game Game to compare year similarity against.
   * @return Map of game/ruleset names to similarity values.
   * @java ContextualSimilarity.getRulesetYearSimilarities(Game)
   */
  public static getRulesetYearSimilarities(
    game: GameLike
  ): Map<string, number> {
    // Get all ruleset ids from DB
    const name = getUniqueName(game);
    const rulesetIds = getRulesetIds(ContextualSimilarity.rulesetIdsFilePath);
    const rulesetId = rulesetIds.get(name) ?? -1;

    const rulesetSimilaritiesIds = new Map<number, number>();        // Map of ruleset ids to similarity
    const rulesetSimilaritiesNames = new Map<string, number>();       // Map of game/ruleset names to similarity

    try {
      const content = fs.readFileSync(
        ContextualSimilarity.rulesetYearDistanceFilePath,
        "utf-8"
      );
      const lines = content.split("\n");
      // Skip first line of column headers.
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined || line.trim().length === 0) continue;
        const values = line.split(",");

        const id0 = parseInt(values[0] ?? "0", 10);
        if (id0 !== rulesetId)
          continue;

        const id1 = parseInt(values[1] ?? "0", 10);
        const dist2 = parseFloat(values[2] ?? "0");
        const similarity = Math.max((5520 - dist2) / 5520, 0); // 5520 years is the maximum possible distance
        rulesetSimilaritiesIds.set(id1, similarity);

        if (!Array.from(rulesetIds.values()).includes(id0))
          console.log(
            "ERROR, two rulesets with the same name. ruleset id: " + id0
          );

        // Convert ruleset ids to corresponding names.
        for (const [entryKey, entryValue] of rulesetIds.entries())
          if (entryValue === id1)
            rulesetSimilaritiesNames.set(entryKey, similarity);
      }
    } catch (e) {
      console.log(
        "Could not find similarity file, ruleset probably has no evidence."
      );
      console.error(e);
    }

    return rulesetSimilaritiesNames;
  }

  //-------------------------------------------------------------------------

}

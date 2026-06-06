// @java Mining/src/utils/RulesetNames.java

/**
 * Helper class to extract standardised (game+ruleset) names from Game objects,
 * following this format:
 *
 * - Amazons_Default
 * - Asalto_Asalto
 * - Alquerque_Murray
 *
 * @java utils/RulesetNames.java
 * @author Dennis Soemers
 */

// Not-yet-ported dependency escape-hatch interfaces
type RulesetLike = { heading: () => string };
type GameLike = { name: () => string; getRuleset: () => RulesetLike | null };

/** @java RulesetNames */
export class RulesetNames {

  /**
   * Filepath for our CSV file. Since this only works with access to private repo
   * anyway, the filepath has been hardcoded for use from Eclipse.
   *
   * This would usually be private and final, but making it public and non-final
   * is very useful for editing the filepath when running on cluster (where LudiiPrivate
   * is not available).
   *
   * @java RulesetNames.FILEPATH
   */
  public static FILEPATH: string = "../../Ludii/Mining/res/concepts/input/GameRulesets.csv";

  /** List of game names loaded from CSV
   * @java RulesetNames.gameNames
   */
  private static gameNames: string[] | null = null;

  /** List of ruleset names loaded from CSV
   * @java RulesetNames.rulesetNames
   */
  private static rulesetNames: string[] | null = null;

  /**
   * No constructor
   * @java RulesetNames()
   */
  private constructor() {
    // Do nothing
  }

  /**
   * @param game
   * @return Game+ruleset name in format GameName_RulesetName
   * @java RulesetNames.gameRulesetName(Game)
   */
  public static gameRulesetName(game: GameLike): string | null {
    if (RulesetNames.gameNames === null)
      RulesetNames.loadData();

    const ruleset: RulesetLike | null = game.getRuleset();
    const rulesetName: string | null = (ruleset === null) ? null : ruleset.heading();

    if (rulesetName === null) {
      for (let i = 0; i < RulesetNames.gameNames!.length; i++) {
        if (RulesetNames.gameNames![i] === game.name()) {
          return (
            (RulesetNames.gameNames![i] + "_" + RulesetNames.rulesetNames![i])
              .replace(/ /g, "_")
              .replace(/\(/g, "")
              .replace(/\)/g, "")
              .replace(/'/g, "")
          );
        }
      }
    } else {
      const nameRuleset: string = ruleset!.heading();
      const startString: string = "Ruleset/";
      const nameRulesetCSV: string =
        nameRuleset.substring(startString.length, ruleset!.heading().lastIndexOf("(") - 1);

      return (
        (game.name() + "_" + nameRulesetCSV)
          .replace(/ /g, "_")
          .replace(/\(/g, "")
          .replace(/\)/g, "")
          .replace(/'/g, "")
      );
    }

    return null;
  }

  /**
   * Load our data from the CSV file
   * @java RulesetNames.loadData()
   */
  private static loadData(): void {
    const fsReadFile = (globalThis as unknown as {
      fsReadFileSync: (path: string, encoding: string) => string;
    }).fsReadFileSync;

    RulesetNames.gameNames = [];
    RulesetNames.rulesetNames = [];

    try {
      const content: string = fsReadFile(RulesetNames.FILEPATH, "utf-8");
      const lines: string[] = content.split("\n");
      for (const line of lines) {
        if (line.trim().length === 0) continue;
        const lineSplit: string[] = line.split(",");
        const gameName: string = lineSplit[0]!.replace(/"/g, "");
        const rulesetName: string = lineSplit[1]!.replace(/"/g, "");
        RulesetNames.gameNames.push(gameName);
        RulesetNames.rulesetNames.push(rulesetName);
      }
    } catch (e) {
      console.error(e);
    }
  }
}

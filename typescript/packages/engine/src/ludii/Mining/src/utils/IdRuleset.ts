// @java Mining/src/utils/IdRuleset.java

import * as fs from "fs";
import * as path from "path";

/**
 * To get the id from the db for a game object compiled with a ruleset.
 *
 * @java utils.IdRuleset
 * @author Eric.Piette
 */

// Not-yet-ported dependency escape-hatch interfaces
type RulesetLike = { heading: () => string };
type GameLike = { name: () => string; getRuleset: () => RulesetLike | null };

/** @java IdRuleset.GAME_RULESET_PATH */
const GAME_RULESET_PATH = "/concepts/input/GameRulesets.csv";

/** @java IdRuleset.readFile */
let readFile = false;

/** @java IdRuleset.gameNames */
const gameNames: string[] = [];

/** @java IdRuleset.rulesetsNames */
const rulesetsNames: string[] = [];

/** @java IdRuleset.ids */
const ids: number[] = [];

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED_VALUE = -1;

/** @java IdRuleset */
export class IdRuleset {

  /**
   * @param game The game object.
   * @return The id from the csv exported from the db.
   * @java IdRuleset.get(Game)
   */
  public static get(game: GameLike): number {
    if (!readFile) {
      try {
        // Attempt to resolve CSV relative to this module's location
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
          gameNames.push(gameName);
          lineNoQuote = lineNoQuote.substring(gameName.length + 1);

          separatorIndex = lineNoQuote.indexOf(",");
          const rulesetName = lineNoQuote.substring(0, separatorIndex);
          rulesetsNames.push(rulesetName);
          lineNoQuote = lineNoQuote.substring(rulesetName.length + 1);
          const id = parseInt(lineNoQuote.trim(), 10);
          ids.push(id);
        }
      } catch (e: unknown) {
        if (
          e instanceof Error &&
          e.message.includes("cleaning your Eclipse projects")
        ) {
          console.error("Try cleaning your Eclipse projects!");
        }
        console.error(e);
      }

      readFile = true;
    }

    const ruleset: RulesetLike | null = game.getRuleset();
    const rulesetName: string | null =
      ruleset === null ? null : ruleset.heading();

    if (rulesetName === null) {
      for (let i = 0; i < gameNames.length; i++)
        if (gameNames[i] === game.name())
          return ids[i]!;
    } else {
      const name_ruleset: string = ruleset!.heading();
      const startString = "Ruleset/";
      const name_ruleset_csv = name_ruleset.substring(
        startString.length,
        ruleset!.heading().lastIndexOf("(") - 1
      );

      for (let i = 0; i < gameNames.length; i++)
        if (
          gameNames[i] === game.name() &&
          rulesetsNames[i] === name_ruleset_csv
        )
          return ids[i]!;
    }

    console.error("NOT FOUND");
    console.error("gameName = " + game.name());
    console.error("rulesetName = " + rulesetName);

    return UNDEFINED_VALUE;
  }

}

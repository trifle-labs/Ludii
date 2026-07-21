// @java Mining/src/utils/agents/GeneratePortfolioAgentScoresDatabaseCSV.java

/**
 * Generates CSV files for database, describing scores of all building blocks
 * of agents for portfolio.
 *
 * @java utils/agents/GeneratePortfolioAgentScoresDatabaseCSV.java
 * @author Dennis Soemers
 */

// Not-yet-ported dependency escape-hatch interfaces
type CommandLineArgParseLike = {
  getValueString: (name: string) => string;
  parseArguments: (args: string[]) => boolean;
  addOption: (opt: ArgOptionLike) => void;
};
type ArgOptionLike = {
  withNames: (...names: string[]) => ArgOptionLike;
  help: (s: string) => ArgOptionLike;
  withNumVals: (n: number) => ArgOptionLike;
  withType: (t: unknown) => ArgOptionLike;
  setRequired: () => ArgOptionLike;
};
type FileHandlingLike = {
  listGames: () => string[];
  loadTextContentsFromFile: (path: string) => string;
};
type StringRoutinesLike = {
  cleanGameName: (s: string) => string;
  cleanRulesetName: (s: string) => string;
  join: (sep: string, parts: string[]) => string;
};
type RulesetLike = { optionSettings: () => string[]; heading: () => string };
type GameDescriptionLike = { rulesets: () => RulesetLike[] };
type GameLike = { description: () => GameDescriptionLike };
type GameLoaderLike = { loadGameFromName: (name: string, ruleset?: string) => GameLike };
type IdRulesetLike = { get: (game: GameLike) => number };
type FileLike = { exists: () => boolean; isDirectory: () => boolean; listFiles: () => FileLike[]; getAbsolutePath: () => string };

/**
 * Data for the table of ruleset+agent scores
 * @java GeneratePortfolioAgentScoresDatabaseCSV.ScoreData
 */
class ScoreData {
  /** @java ScoreData.nextID */
  private static nextID: number = 1;

  /** @java ScoreData.id */
  public readonly id: number;
  /** @java ScoreData.rulesetID */
  public readonly rulesetID: number;
  /** @java ScoreData.agent */
  public readonly agent: string;
  /** @java ScoreData.score */
  public score: number;
  /** @java ScoreData.numMatchups */
  public numMatchups: number;

  /** @java ScoreData(int, String, double, int) */
  public constructor(rulesetID: number, agent: string, score: number, numMatchups: number) {
    this.id = ScoreData.nextID++;
    this.rulesetID = rulesetID;
    this.agent = agent;
    this.score = score;
    this.numMatchups = numMatchups;
  }

  /** @java ScoreData.toString() */
  public toString(): string {
    const stringRoutines = (globalThis as unknown as { StringRoutines: StringRoutinesLike }).StringRoutines;
    const agentParts: string[] = this.agent.split("-").slice(0, 5);
    while (agentParts.length < 5) {
      agentParts.push("NULL");
    }
    for (let i = 0; i < agentParts.length; ++i) {
      if (agentParts[i] === undefined || agentParts[i] === null) {
        agentParts[i] = "NULL";
      }
    }
    return this.id + "," + this.rulesetID + "," + stringRoutines.join(",", agentParts) + "," + this.score + "," + this.numMatchups;
  }
}

/** @java GeneratePortfolioAgentScoresDatabaseCSV */
export class GeneratePortfolioAgentScoresDatabaseCSV {

  /** @java GeneratePortfolioAgentScoresDatabaseCSV() */
  private constructor() {
    // Do nothing
  }

  /**
   * Generates our CSV
   * @java GeneratePortfolioAgentScoresDatabaseCSV.generateCSVs(CommandLineArgParse)
   */
  private static generateCSVs(argParse: CommandLineArgParseLike): void {
    const fileHandling = (globalThis as unknown as { FileHandling: FileHandlingLike }).FileHandling;
    const stringRoutines = (globalThis as unknown as { StringRoutines: StringRoutinesLike }).StringRoutines;
    const gameLoader = (globalThis as unknown as { GameLoader: GameLoaderLike }).GameLoader;
    const idRuleset = (globalThis as unknown as { IdRuleset: IdRulesetLike }).IdRuleset;
    const FileCls = (globalThis as unknown as { File: new (path: string) => FileLike }).File;

    let resultsDir: string = argParse.getValueString("--results-dir");
    resultsDir = resultsDir.replace(/\\/g, "/");
    if (!resultsDir.endsWith("/"))
      resultsDir += "/";

    const allGameNames: string[] = fileHandling.listGames().filter((s: string) => {
      const n = s.replace(/\\/g, "/");
      return (
        !n.includes("/lud/bad/") &&
        !n.includes("/lud/wip/") &&
        !n.includes("/lud/WishlistDLP/") &&
        !n.includes("/lud/test/") &&
        !n.includes("/lud/wishlist/") &&
        !n.includes("/lud/reconstruction/") &&
        !n.includes("/lud/simulation/") &&
        !n.includes("/lud/proprietary/")
      );
    });

    const scoreDataList: ScoreData[] = [];

    for (const fullGamePath of allGameNames) {
      const gamePathParts: string[] = fullGamePath.replace(/\\/g, "/").split("/");
      const gameName: string = gamePathParts[gamePathParts.length - 1]!.replace(/\.lud/g, "");
      const gameNoRuleset: GameLike = gameLoader.loadGameFromName(gameName + ".lud");
      const gameRulesets: Array<RulesetLike | null> = [...gameNoRuleset.description().rulesets(), null];
      let foundRealRuleset: boolean = false;

      for (const ruleset of gameRulesets) {
        let game: GameLike;
        let fullRulesetName: string = "";
        if (ruleset === null && foundRealRuleset) {
          // Skip this, don't allow game without ruleset if we do have real implemented ones
          continue;
        } else if (ruleset !== null && ruleset.optionSettings().length > 0) {
          fullRulesetName = ruleset.heading();
          foundRealRuleset = true;
          game = gameLoader.loadGameFromName(gameName + ".lud", fullRulesetName);
        } else if (ruleset !== null && ruleset.optionSettings().length === 0) {
          // Skip empty ruleset
          continue;
        } else {
          game = gameNoRuleset;
        }

        //			if (game.isDeductionPuzzle())
        //				continue;
        //
        //			if (game.isSimulationMoveGame())
        //				continue;
        //
        //			if (!game.isAlternatingMoveGame())
        //				continue;
        //
        //			if (game.hasSubgames())
        //				continue;

        const filepathsGameName: string = stringRoutines.cleanGameName(gameName);
        const filepathsRulesetName: string = stringRoutines.cleanRulesetName(fullRulesetName.replace(/Ruleset\//g, ""));

        const rulesetResultsDir: FileLike = new FileCls(resultsDir + filepathsGameName + filepathsRulesetName);
        if (rulesetResultsDir.exists()) {
          const rulesetID: number = idRuleset.get(game!);

          // Map from agent names to sum of scores for this ruleset
          const agentScoreSums: Map<string, number> = new Map<string, number>();
          // Map from agent names to how often we observed this heuristic in this ruleset
          const agentCounts: Map<string, number> = new Map<string, number>();

          const jobDirs: FileLike[] = rulesetResultsDir.listFiles();
          for (const jobDir of jobDirs) {
            if (jobDir.isDirectory()) {
              const resultLines: string[] =
                fileHandling.loadTextContentsFromFile(
                  jobDir.getAbsolutePath() + "/alpha_rank_data.csv"
                ).split("\n");

              // Skip index 0, that's just the headings
              for (let i = 1; i < resultLines.length; ++i) {
                const line: string = resultLines[i]!;
                const idxQuote1: number = 0;
                const idxQuote2: number = line.indexOf("\"", idxQuote1 + 1);
                const idxQuote3: number = line.indexOf("\"", idxQuote2 + 1);
                const idxQuote4: number = line.indexOf("\"", idxQuote3 + 1);

                const agentsTuple: string =
                  line
                    .substring(idxQuote1 + 2, idxQuote2 - 1)
                    .replace(/ /g, "")
                    .replace(/'/g, "");
                const scoresTuple: string =
                  line
                    .substring(idxQuote3 + 2, idxQuote4 - 1)
                    .replace(/ /g, "");

                const agentNames: string[] = agentsTuple.split(",");
                const scores: string[] = scoresTuple.split(",");

                for (let j = 0; j < agentNames.length; ++j) {
                  const agentName: string = agentNames[j]!.replace(/'/g, "");

                  if (parseFloat(scores[j]!) < -1.0 || parseFloat(scores[j]!) > 1.0) {
                    console.log(scores[j]);
                    console.log("Line " + i + " of " + jobDir.getAbsolutePath() + "/alpha_rank_data.csv");
                  }

                  // Convert score to "win percentage"
                  const score: number = ((parseFloat(scores[j]!) + 1.0) / 2.0) * 100.0;

                  agentScoreSums.set(agentName, (agentScoreSums.get(agentName) ?? 0) + score);
                  agentCounts.set(agentName, (agentCounts.get(agentName) ?? 0) + 1);
                }
              }
            }
          }

          const rulesetScoreData: ScoreData[] = [];

          for (const agent of agentScoreSums.keys()) {
            const score: number = agentScoreSums.get(agent)! / agentCounts.get(agent)!;
            rulesetScoreData.push(new ScoreData(rulesetID, agent, score, agentCounts.get(agent)!));
          }

          scoreDataList.push(...rulesetScoreData);
        }
      }
    }

    // Write RulesetPortfolioAgents.csv
    const scoreLines: string[] = scoreDataList.map((data) => data.toString());
    (globalThis as unknown as { writeFile: (path: string, lines: string[]) => void }).writeFile(
      "../Mining/res/agents/RulesetPortfolioAgents.csv",
      scoreLines
    );
  }

  /**
   * Main method to generate all our scripts
   * @java GeneratePortfolioAgentScoresDatabaseCSV.main(String[])
   */
  public static main(args: string[]): void {
    const CommandLineArgParseCls = (globalThis as unknown as {
      CommandLineArgParse: new (b: boolean, desc: string) => CommandLineArgParseLike;
    }).CommandLineArgParse;
    const ArgOptionCls = (globalThis as unknown as {
      ArgOption: new () => ArgOptionLike;
    }).ArgOption;
    const OptionTypes = (globalThis as unknown as { OptionTypes: { String: unknown } }).OptionTypes;

    const argParse: CommandLineArgParseLike = new CommandLineArgParseCls(
      true,
      "Generates CSV files for database, describing scores of all building blocks for agents for portfolio."
    );

    argParse.addOption(
      new ArgOptionCls()
        .withNames("--results-dir")
        .help("Filepath for directory with per-game subdirectories.")
        .withNumVals(1)
        .withType(OptionTypes.String)
        .setRequired()
    );

    // parse the args
    if (!argParse.parseArguments(args))
      return;

    GeneratePortfolioAgentScoresDatabaseCSV.generateCSVs(argParse);
  }
}

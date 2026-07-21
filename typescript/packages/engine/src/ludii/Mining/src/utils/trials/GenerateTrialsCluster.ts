// @java Mining/src/utils/trials/GenerateTrialsCluster.java

/**
 * To generate, and store, trials for every game.
 * Games for which trials are already stored will be skipped.
 *
 * @java utils/trials/GenerateTrialsCluster.java
 * @author Eric Piette
 */

// Not-yet-ported dependencies — escape-hatch interfaces
type RulesetLike = { optionSettings: () => string[]; heading: () => string };
type GameDescriptionLike = { rulesets: () => RulesetLike[] | null };
type ContextLike = { rng: () => { saveState: () => unknown }; model: () => ModelLike };
type TrialLike = { over: () => boolean; saveTrialToTextFile: (file: unknown, gamePath: string, opts: string[], rngState: unknown) => void };
type ModelLike = { startNewStep: (ctx: ContextLike, ais: AILike[], time: number) => void };
type AILike = {
  supportsGame: (g: GameLike) => boolean;
  setMaxSecondsPerMove: (s: number) => void;
  initAI: (g: GameLike, p: number) => void;
};
type AlphaBetaSearchLike = AILike & { setAllowedSearchDepths: (d: string) => void };
type GameLike = {
  name: () => string;
  description: () => GameDescriptionLike;
  players: () => { count: () => number };
  setMaxMoveLimit: (limit: number) => void;
  start: (ctx: ContextLike) => void;
  getOptions: () => string[];
  getRuleset: () => RulesetLike;
};
type GameLoaderLike = { loadGameFromName: (name: string, ...opts: unknown[]) => GameLike };
type FileHandlingLike = { listGames: () => string[] };
type AIFactoryLike = { createAI: (name: string) => AILike };

/** Number of random trials to generate per game — @java GenerateTrialsCluster.NUM_TRIALS_PER_GAME */
let NUM_TRIALS_PER_GAME = 0;

/** The move limit to use to generate the trials — @java GenerateTrialsCluster.moveLimit */
let moveLimit = 0;

/** @java GenerateTrialsCluster.rootPath */
const rootPath = "/data/Trials/";

/** @java GenerateTrialsCluster */
export class GenerateTrialsCluster {
  /**
   * Generates trials.
   *
   * Arg 1 = Move Limit.
   * Arg 2 = Thinking time for the agents.
   * Arg 3 = Num trials to generate.
   * Arg 4 = Name of the agent.
   * Arg 5 = Name of the game.
   * Arg 6 = Name of the ruleset.
   *
   * @java GenerateTrialsCluster.main(String[])
   */
  public static main(args: string[]): void {
    const DEFAULT_MOVES_LIMIT = 1000; // Constants.DEFAULT_MOVES_LIMIT approximation
    moveLimit = args.length === 0 ? DEFAULT_MOVES_LIMIT : parseInt(args[0] ?? "0");
    const thinkingTime = args.length < 2 ? 1 : parseFloat(args[1] ?? "1");
    NUM_TRIALS_PER_GAME = args.length < 3 ? 100 : parseInt(args[2] ?? "100");
    const agentName = args.length < 4 ? "Random" : (args[3] ?? "Random");
    const gameNameExpected = args.length < 5 ? "" : (args[4] ?? "");
    const rulesetExpected = args.length < 6 ? "" : (args[5] ?? "");

    const fileHandling = (globalThis as unknown as { FileHandling: FileHandlingLike }).FileHandling;
    const gameLoader = (globalThis as unknown as { GameLoader: GameLoaderLike }).GameLoader;
    const fs = (globalThis as unknown as { FS: { existsSync: (p: string) => boolean; mkdirSync: (p: string, o?: unknown) => void; existsFile: (p: string) => boolean } }).FS;

    const gamePaths: string[] = fileHandling.listGames();
    let index = 0;
    let gamePath = "";

    console.log("Game looking for is " + gameNameExpected);
    console.log("Ruleset looking for is " + rulesetExpected);

    // Check if the game path exits.
    for (; index < gamePaths.length; index++) {
      if (!(gamePaths[index] ?? "").includes(gameNameExpected)) continue;
      gamePath = gamePaths[index] ?? "";
      break;
    }

    // Game not found!
    if (index >= gamePaths.length) {
      console.error("ERROR GAME NOT FOUND");
    } else {
      console.log("GAME FOUND");
    }

    gamePath = gamePath.replace(/\\/g, "/");

    const game: GameLike = gameLoader.loadGameFromName(gamePath);
    game.setMaxMoveLimit(moveLimit);

    const trialForStart = (globalThis as unknown as { Trial: new (g: GameLike) => TrialLike }).Trial;
    const contextForStart = (globalThis as unknown as { Context: new (g: GameLike, t: TrialLike) => ContextLike }).Context;
    game.start(new contextForStart(game, new trialForStart(game)));

    console.log("Loading game: " + game.name());

    const testPath = rootPath + "Trials" + agentName;
    console.log(testPath);
    if (!fs?.existsSync(testPath)) {
      console.log("not existing :(");
    }

    const gameFolderPath = rootPath + "Trials" + agentName + "/" + game.name();
    if (!fs?.existsSync(gameFolderPath)) {
      fs?.mkdirSync(gameFolderPath, { recursive: true });
    }

    console.log(gameFolderPath);

    // Check if the game has a ruleset.
    const rulesetsInGame: RulesetLike[] | null = game.description().rulesets();

    // Has many rulesets.
    if (rulesetsInGame !== null && rulesetsInGame.length > 0) {
      for (let rs = 0; rs < rulesetsInGame.length; rs++) {
        const ruleset = rulesetsInGame[rs]!;

        // We check if we want a specific ruleset.
        if (rulesetExpected.length > 0 && rulesetExpected !== ruleset.heading()) continue;

        if (ruleset.optionSettings().length > 0) { // We check if the ruleset is implemented.
          const rulesetGame: GameLike = gameLoader.loadGameFromName(gamePath, ruleset.optionSettings());
          rulesetGame.setMaxMoveLimit(moveLimit);

          const rulesetFolderPath =
            gameFolderPath + "/" +
            rulesetGame.getRuleset().heading().replace(/\//g, "_");

          if (!fs?.existsSync(rulesetFolderPath)) {
            fs?.mkdirSync(rulesetFolderPath, { recursive: true });
          }

          console.log("Loading ruleset: " + rulesetGame.getRuleset().heading());

          for (let i = 0; i < NUM_TRIALS_PER_GAME; ++i) {
            console.log("Starting playout for: ...");
            const trialFilepath = rulesetFolderPath + "/" + agentName + "Trial_" + i + ".txt";

            if (fs?.existsSync(trialFilepath)) continue;

            // Set the agents.
            const ais: AILike[] = GenerateTrialsCluster.chooseAI(rulesetGame, agentName, i);
            for (const ai of ais) {
              if (ai !== null) ai.setMaxSecondsPerMove(thinkingTime);
            }

            const TrialCtor = (globalThis as unknown as { Trial: new (g: GameLike) => TrialLike }).Trial;
            const ContextCtor = (globalThis as unknown as { Context: new (g: GameLike, t: TrialLike) => ContextLike }).Context;

            const trial: TrialLike = new TrialCtor(rulesetGame);
            const context: ContextLike = new ContextCtor(rulesetGame, trial);

            const startRNGState: unknown = context.rng().saveState();
            rulesetGame.start(context);

            // Init the ais.
            for (let p = 1; p <= rulesetGame.players().count(); ++p) {
              ais[p]!.initAI(rulesetGame, p);
            }
            const model = context.model();

            // Run the trial.
            while (!trial.over()) {
              model.startNewStep(context, ais, thinkingTime);
            }

            try {
              trial.saveTrialToTextFile(
                { path: trialFilepath },
                gamePath,
                rulesetGame.getOptions(),
                startRNGState
              );
              console.log(
                "Saved trial for " + rulesetGame.name() + "|" +
                rulesetGame.getRuleset().heading().replace(/\//g, "_") +
                " to file: " + trialFilepath
              );
            } catch (e) {
              console.error(e);
              throw new Error("Crashed when trying to save trial to file.");
            }
          }
        }
      }
    } else {
      // Code for the default ruleset.
      for (let i = 0; i < NUM_TRIALS_PER_GAME; ++i) {
        console.log("Starting playout for: ...");
        const trialFilepath = gameFolderPath + "/" + agentName + "Trial_" + i + ".txt";

        if (fs?.existsSync(trialFilepath)) continue;

        // Set the agents.
        const ais: AILike[] = GenerateTrialsCluster.chooseAI(game, agentName, i);
        for (const ai of ais) {
          if (ai !== null) ai.setMaxSecondsPerMove(thinkingTime);
        }

        const TrialCtor = (globalThis as unknown as { Trial: new (g: GameLike) => TrialLike }).Trial;
        const ContextCtor = (globalThis as unknown as { Context: new (g: GameLike, t: TrialLike) => ContextLike }).Context;

        const trial: TrialLike = new TrialCtor(game);
        const context: ContextLike = new ContextCtor(game, trial);

        const startRNGState: unknown = context.rng().saveState();
        game.start(context);

        // Init the ais.
        for (let p = 1; p <= game.players().count(); ++p) {
          ais[p]!.initAI(game, p);
        }
        const model = context.model();

        // Run the trial.
        while (!trial.over()) {
          model.startNewStep(context, ais, thinkingTime);
        }

        try {
          trial.saveTrialToTextFile(
            { path: trialFilepath },
            gamePath,
            [],
            startRNGState
          );
          console.log("Saved trial for " + game.name() + " to file: " + trialFilepath);
        } catch (e) {
          console.error(e);
          throw new Error("Crashed when trying to save trial to file.");
        }
      }
    }
  }

  /**
   * @param game The game.
   * @param agentName The name of the agent.
   * @param indexPlayout The index of the playout.
   * @return The list of AIs to play that playout.
   *
   * @java GenerateTrialsCluster.chooseAI(Game, String, int)
   */
  private static chooseAI(game: GameLike, agentName: string, indexPlayout: number): AILike[] {
    const AIFactory = (globalThis as unknown as { AIFactory: AIFactoryLike }).AIFactory;
    const RandomAI = (globalThis as unknown as { RandomAI: new () => AILike }).RandomAI;
    const AlphaBetaSearch = (globalThis as unknown as { AlphaBetaSearch: new () => AlphaBetaSearchLike }).AlphaBetaSearch;

    const ais: AILike[] = [];
    ais.push(null as unknown as AILike); // index 0 unused

    for (let p = 1; p <= game.players().count(); ++p) {
      if (agentName === "UCT") {
        const ai = AIFactory.createAI("UCT");
        if (ai.supportsGame(game)) {
          ais.push(ai);
        } else {
          ais.push(new RandomAI());
        }
      } else if (agentName === "Alpha-Beta") {
        let ai = AIFactory.createAI("Alpha-Beta");
        if (ai.supportsGame(game)) {
          ais.push(ai);
        } else if (AIFactory.createAI("UCT").supportsGame(game)) {
          ai = AIFactory.createAI("UCT");
          ais.push(ai);
        } else {
          ais.push(new RandomAI());
        }
      } else if (agentName === "Alpha-Beta-UCT") { // AB/UCT/AB/UCT/...
        if (indexPlayout % 2 === 0) {
          if (p % 2 === 1) {
            let ai = AIFactory.createAI("Alpha-Beta");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else if (AIFactory.createAI("UCT").supportsGame(game)) {
              ai = AIFactory.createAI("UCT");
              ais.push(ai);
            } else {
              ais.push(new RandomAI());
            }
          } else {
            const ai = AIFactory.createAI("UCT");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else {
              ais.push(new RandomAI());
            }
          }
        } else {
          if (p % 2 === 1) {
            const ai = AIFactory.createAI("UCT");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else {
              ais.push(new RandomAI());
            }
          } else {
            let ai = AIFactory.createAI("Alpha-Beta");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else if (AIFactory.createAI("UCT").supportsGame(game)) {
              ai = AIFactory.createAI("UCT");
              ais.push(ai);
            } else {
              ais.push(new RandomAI());
            }
          }
        }
      } else if (agentName === "AB-Odd-Even") { // Alternating between AB Odd and AB Even
        if (indexPlayout % 2 === 0) {
          if (p % 2 === 1) {
            let ai: AILike = new AlphaBetaSearch();
            (ai as AlphaBetaSearchLike).setAllowedSearchDepths("Odd");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else if (AIFactory.createAI("UCT").supportsGame(game)) {
              ai = AIFactory.createAI("UCT");
              ais.push(ai);
            } else {
              ais.push(new RandomAI());
            }
          } else {
            const ai = new AlphaBetaSearch();
            ai.setAllowedSearchDepths("Even");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else {
              ais.push(new RandomAI());
            }
          }
        } else {
          if (p % 2 === 1) {
            const ai = new AlphaBetaSearch();
            ai.setAllowedSearchDepths("Even");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else {
              ais.push(new RandomAI());
            }
          } else {
            let ai: AILike = new AlphaBetaSearch();
            (ai as AlphaBetaSearchLike).setAllowedSearchDepths("Odd");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else if (AIFactory.createAI("UCT").supportsGame(game)) {
              ai = AIFactory.createAI("UCT");
              ais.push(ai);
            } else {
              ais.push(new RandomAI());
            }
          }
        }
      } else {
        ais.push(new RandomAI());
      }
    }
    return ais;
  }
}

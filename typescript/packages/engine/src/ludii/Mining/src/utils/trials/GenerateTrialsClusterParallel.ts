// @java Mining/src/utils/trials/GenerateTrialsClusterParallel.java

/**
 * To generate, and store, trials for every game in parallel.
 * Games for which trials are already stored will be skipped.
 *
 * @java utils/trials/GenerateTrialsClusterParallel.java
 * @author Eric Piette
 */

// Not-yet-ported dependencies — escape-hatch interfaces
type RulesetLike = { optionSettings: () => string[]; heading: () => string };
type GameDescriptionLike = { rulesets: () => RulesetLike[] | null };
type ContextLike = {
  rng: () => { saveState: () => unknown };
  model: () => ModelLike;
  trial: () => { numMoves: () => number; numInitialPlacementMoves: () => number };
};
type TrialLike = {
  over: () => boolean;
  saveTrialToTextFile: (file: unknown, path: string, opts: string[], rngState: unknown) => void;
};
type ModelLike = { startNewStep: (ctx: ContextLike, ais: AILike[], time: number) => void };
type AILike = {
  supportsGame: (g: GameLike) => boolean;
  setMaxSecondsPerMove: (s: number) => void;
  initAI: (g: GameLike, p: number) => void;
  friendlyName: () => string;
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
type ListUtilsLike = {
  generatePermutations: (arr: number[]) => number[][];
  samplePermutations: (arr: number[], n: number) => number[][];
};
type ResultsSummaryLike = {
  recordResults: (agentPermutation: number[], utilities: number[], numMovesPlayed: number) => void;
  writeAlphaRankData: (file: unknown) => void;
};
type RankUtilsLike = { agentUtilities: (ctx: ContextLike) => number[] };

/** Number of random trials to generate per game — @java GenerateTrialsClusterParallel.NUM_TRIALS_PER_GAME */
let NUM_TRIALS_PER_GAME = 0;

/** The move limit to use to generate the trials — @java GenerateTrialsClusterParallel.moveLimit */
let moveLimit = 0;

/** @java GenerateTrialsClusterParallel.rootPath */
const rootPath = "./";

/** Number of parallel playouts we run — @java GenerateTrialsClusterParallel.NUM_PARALLEL */
const NUM_PARALLEL = 3;

/** @java GenerateTrialsClusterParallel */
export class GenerateTrialsClusterParallel {
  /**
   * Generates trials.
   *
   * Arg 1 = Move Limit.
   * Arg 2 = Thinking time for the agents.
   * Arg 3 = Num trials to generate.
   * Arg 4 = Name of the agent.
   * Arg 5 = Name of the game.
   * Arg 6 = Name of the ruleset.
   * Arg 7 = Name of second agent (leave empty if only Arg 4 is desired).
   * Arg 8 = Name we append to "Trials"; will use Arg 4 if left empty.
   *
   * @java GenerateTrialsClusterParallel.main(String[])
   */
  public static async main(args: string[]): Promise<void> {
    const DEFAULT_MOVES_LIMIT = 1000; // Constants.DEFAULT_MOVES_LIMIT approximation
    moveLimit = args.length === 0 ? DEFAULT_MOVES_LIMIT : parseInt(args[0] ?? "0");
    const thinkingTime = args.length < 2 ? 1 : parseFloat(args[1] ?? "1");
    NUM_TRIALS_PER_GAME = args.length < 3 ? 100 : parseInt(args[2] ?? "100");
    const agentName = args.length < 4 ? "Random" : (args[3] ?? "Random");
    const gameNameExpected = args.length < 5 ? "" : (args[4] ?? "");
    const rulesetExpected = args.length < 6 ? "" : (args[5] ?? "");
    const agentName2 = args.length < 7 ? "" : (args[6] ?? "");
    const trialsDirName = args.length < 8 ? agentName : (args[7] ?? agentName);

    const fileHandling = (globalThis as unknown as { FileHandling: FileHandlingLike }).FileHandling;
    const gameLoader = (globalThis as unknown as { GameLoader: GameLoaderLike }).GameLoader;
    const FS = (globalThis as unknown as { FS: { existsSync: (p: string) => boolean; mkdirSync: (p: string, o?: unknown) => void } }).FS;
    const ListUtils = (globalThis as unknown as { ListUtils: ListUtilsLike }).ListUtils;
    const RankUtils = (globalThis as unknown as { RankUtils: RankUtilsLike }).RankUtils;
    const ResultsSummary = (globalThis as unknown as { ResultsSummary: new (g: GameLike, strs: string[]) => ResultsSummaryLike }).ResultsSummary;
    const TrialCtor = (globalThis as unknown as { Trial: new (g: GameLike) => TrialLike }).Trial;
    const ContextCtor = (globalThis as unknown as { Context: new (g: GameLike, t: TrialLike) => ContextLike }).Context;

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
    game.start(new ContextCtor(game, new TrialCtor(game)));

    console.log("Loading game: " + game.name());

    const testPath = rootPath + "Trials" + trialsDirName;
    console.log(testPath);
    if (!FS?.existsSync(testPath)) {
      console.log("not existing :(");
    }

    const gameFolderPath = rootPath + "Trials" + trialsDirName + "/" + game.name();
    if (!FS?.existsSync(gameFolderPath)) {
      FS?.mkdirSync(gameFolderPath, { recursive: true });
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
            gameFolderPath + "/" + rulesetGame.getRuleset().heading().replace(/\//g, "_");

          if (!FS?.existsSync(rulesetFolderPath)) {
            FS?.mkdirSync(rulesetFolderPath, { recursive: true });
          }

          console.log("Loading ruleset: " + rulesetGame.getRuleset().heading());

          let beginTrialIndex = 0;
          for (; beginTrialIndex < NUM_TRIALS_PER_GAME; ++beginTrialIndex) {
            const trialFilepath = rulesetFolderPath + "/" + trialsDirName + "Trial_" + beginTrialIndex + ".txt";
            if (!FS?.existsSync(trialFilepath)) break;
          }

          if (beginTrialIndex < NUM_TRIALS_PER_GAME) {
            const parallelNum = (NUM_TRIALS_PER_GAME - beginTrialIndex) > NUM_PARALLEL
              ? NUM_PARALLEL
              : (NUM_TRIALS_PER_GAME - beginTrialIndex);

            // For every thread, create a list of AIs to be used for all trials in that thread
            const aisListPerThread: AILike[][] = [];
            for (let i = 0; i < parallelNum; ++i) {
              const aiList = GenerateTrialsClusterParallel.chooseAI(rulesetGame, agentName, agentName2, 0);
              for (const ai of aiList) {
                if (ai !== null) ai.setMaxSecondsPerMove(thinkingTime);
              }
              aisListPerThread.push(aiList);
            }

            const numPlayers = rulesetGame.players().count();
            let aiListPermutations: number[][];
            if (numPlayers <= 5) {
              // Compute all possible permutations of indices
              const indices: number[] = Array.from({ length: numPlayers }, (_, k) => k);
              aiListPermutations = ListUtils.generatePermutations(indices);
              // shuffle
              for (let i = aiListPermutations.length - 1; i > 0; i--) {
                const j = Math.trunc(Math.random() * (i + 1));
                const tmp = aiListPermutations[i]!;
                aiListPermutations[i] = aiListPermutations[j]!;
                aiListPermutations[j] = tmp;
              }
            } else {
              // Randomly generate some permutations
              const indices: number[] = Array.from({ length: numPlayers }, (_, k) => k);
              aiListPermutations = ListUtils.samplePermutations(indices, 120);
            }

            const agentStrings: string[] = [];
            for (let p = 1; p <= numPlayers; ++p) {
              agentStrings.push(aisListPerThread[0]![p - 1]!.friendlyName());
            }
            const resultsSummary = new ResultsSummary(rulesetGame, agentStrings);

            // Run trials in parallel using Promise.all (TypeScript analogue of ExecutorService)
            const promises: Promise<void>[] = [];
            for (let i = beginTrialIndex; i < NUM_TRIALS_PER_GAME; ++i) {
              const trialFilepath = rulesetFolderPath + "/" + trialsDirName + "Trial_" + i + ".txt";
              const numTrial = i;
              const path = gamePath;
              const threadIdx = numTrial % parallelNum;

              promises.push((async () => {
                try {
                  console.log("Starting playout " + numTrial + ": ...");

                  // Create re-ordered list of AIs for this particular trial
                  const ais: AILike[] = [];
                  ais.push(null as unknown as AILike);
                  const currentAIsPermutation = numTrial % aiListPermutations.length;
                  const currentPlayersPermutation = aiListPermutations[currentAIsPermutation]!;
                  for (let j = 0; j < currentPlayersPermutation.length; ++j) {
                    ais.push(aisListPerThread[threadIdx]![currentPlayersPermutation[j]! % numPlayers]!);
                  }

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
                      path,
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

                  // Record outcome
                  const utilities: number[] = RankUtils.agentUtilities(context);
                  const numMovesPlayed =
                    context.trial().numMoves() - context.trial().numInitialPlacementMoves();
                  const agentPermutation: number[] = new Array(currentPlayersPermutation.length + 1).fill(0);
                  for (let k = 0; k < currentPlayersPermutation.length; k++) {
                    agentPermutation[k + 1] = currentPlayersPermutation[k] ?? 0;
                  }
                  resultsSummary.recordResults(agentPermutation, utilities, numMovesPlayed);
                } catch (e) {
                  console.error(e);
                }
              })());

              // Limit to NUM_PARALLEL concurrent
              if (promises.length >= parallelNum) {
                await Promise.all(promises.splice(0, parallelNum));
              }
            }
            await Promise.all(promises);

            const uniqueNames = new Set(agentStrings);
            if (uniqueNames.size > 1) {
              // We have more than one agent name, so print per-agent results
              resultsSummary.writeAlphaRankData(
                { path: rulesetFolderPath + "/" + trialsDirName + "alpha_rank_data.csv" }
              );
            }
          }
        }
      }
    } else {
      // Code for the default ruleset.
      let beginTrialIndex = 0;
      for (; beginTrialIndex < NUM_TRIALS_PER_GAME; ++beginTrialIndex) {
        const trialFilepath = gameFolderPath + "/" + trialsDirName + "Trial_" + beginTrialIndex + ".txt";
        if (!FS?.existsSync(trialFilepath)) break;
      }

      if (beginTrialIndex < NUM_TRIALS_PER_GAME) {
        const parallelNum = (NUM_TRIALS_PER_GAME - beginTrialIndex) > NUM_PARALLEL
          ? NUM_PARALLEL
          : (NUM_TRIALS_PER_GAME - beginTrialIndex);

        // For every thread, create a list of AIs to be used for all trials in that thread
        const aisListPerThread: AILike[][] = [];
        for (let i = 0; i < parallelNum; ++i) {
          const aiList = GenerateTrialsClusterParallel.chooseAI(game, agentName, agentName2, 0);
          for (const ai of aiList) {
            if (ai !== null) ai.setMaxSecondsPerMove(thinkingTime);
          }
          aisListPerThread.push(aiList);
        }

        const numPlayers = game.players().count();
        let aiListPermutations: number[][];
        if (numPlayers <= 5) {
          const indices: number[] = Array.from({ length: numPlayers }, (_, k) => k);
          aiListPermutations = ListUtils.generatePermutations(indices);
          // shuffle
          for (let i = aiListPermutations.length - 1; i > 0; i--) {
            const j = Math.trunc(Math.random() * (i + 1));
            const tmp2 = aiListPermutations[i]!;
            aiListPermutations[i] = aiListPermutations[j]!;
            aiListPermutations[j] = tmp2;
          }
        } else {
          const indices: number[] = Array.from({ length: numPlayers }, (_, k) => k);
          aiListPermutations = ListUtils.samplePermutations(indices, 120);
        }

        const agentStrings: string[] = [];
        for (let p = 1; p <= numPlayers; ++p) {
          agentStrings.push(aisListPerThread[0]![p - 1]!.friendlyName());
        }
        const resultsSummary = new ResultsSummary(game, agentStrings);

        const promises: Promise<void>[] = [];
        for (let i = beginTrialIndex; i < NUM_TRIALS_PER_GAME; ++i) {
          const trialFilepath = gameFolderPath + "/" + trialsDirName + "Trial_" + i + ".txt";
          const numTrial = i;
          const path = gamePath;
          const threadIdx = numTrial % parallelNum;

          promises.push((async () => {
            try {
              console.log("Starting playout " + numTrial + ": ...");

              // Create re-ordered list of AIs for this particular trial
              const ais: AILike[] = [];
              ais.push(null as unknown as AILike);
              const currentAIsPermutation = numTrial % aiListPermutations.length;
              const currentPlayersPermutation = aiListPermutations[currentAIsPermutation]!;
              for (let j = 0; j < currentPlayersPermutation.length; ++j) {
                ais.push(aisListPerThread[threadIdx]![currentPlayersPermutation[j]! % numPlayers]!);
              }

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
                  path,
                  [],
                  startRNGState
                );
                console.log("Saved trial for " + game.name() + " to file: " + trialFilepath);
              } catch (e) {
                console.error(e);
                throw new Error("Crashed when trying to save trial to file.");
              }

              // Record outcome
              const utilities: number[] = RankUtils.agentUtilities(context);
              const numMovesPlayed =
                context.trial().numMoves() - context.trial().numInitialPlacementMoves();
              const agentPermutation: number[] = new Array(currentPlayersPermutation.length + 1).fill(0);
              for (let k = 0; k < currentPlayersPermutation.length; k++) {
                agentPermutation[k + 1] = currentPlayersPermutation[k] ?? 0;
              }
              resultsSummary.recordResults(agentPermutation, utilities, numMovesPlayed);
            } catch (e) {
              console.error(e);
            }
          })());

          if (promises.length >= parallelNum) {
            await Promise.all(promises.splice(0, parallelNum));
          }
        }
        await Promise.all(promises);

        const uniqueNames = new Set(agentStrings);
        if (uniqueNames.size > 1) {
          resultsSummary.writeAlphaRankData(
            { path: gameFolderPath + "/" + trialsDirName + "alpha_rank_data.csv" }
          );
        }
      }
    }
  }

  /**
   * @param game The game.
   * @param agentName The name of the agent.
   * @param agentName2 The name of the second agent (can be empty string if not used).
   * @param indexPlayout The index of the playout.
   * @return The list of AIs to play that playout.
   *
   * @java GenerateTrialsClusterParallel.chooseAI(Game, String, String, int)
   */
  private static chooseAI(
    game: GameLike,
    agentName: string,
    agentName2: string,
    indexPlayout: number
  ): AILike[] {
    const AIFactory = (globalThis as unknown as { AIFactory: AIFactoryLike }).AIFactory;
    const RandomAI = (globalThis as unknown as { RandomAI: new () => AILike }).RandomAI;
    const AlphaBetaSearch = (globalThis as unknown as { AlphaBetaSearch: new () => AlphaBetaSearchLike }).AlphaBetaSearch;

    const ais: AILike[] = [];

    if (agentName2.length > 0) {
      // Special case where we have provided two different names
      if (game.players().count() === 2) {
        ais.push(AIFactory.createAI(agentName));
        ais.push(AIFactory.createAI(agentName2));
        return ais;
      } else {
        console.error("Provided 2 agent names, but not a 2-player game!");
      }
    }

    // Continue with Eric's original implementation

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

/**
 * Thread factory that gives us consecutive IDs.
 * In TypeScript/JS single-threaded model this is a no-op stub — maintained for parity.
 *
 * @java GenerateTrialsClusterParallel.TrialsThreadFactory
 */
export class TrialsThreadFactory {
  /** @java TrialsThreadFactory.nextID */
  private nextID = 0;

  /**
   * @java TrialsThreadFactory.newThread(Runnable)
   */
  public newThread(r: () => void): { run: () => void; name: string } {
    const id = this.nextID++;
    return {
      name: "Trials Thread " + id,
      run: r,
    };
  }
}

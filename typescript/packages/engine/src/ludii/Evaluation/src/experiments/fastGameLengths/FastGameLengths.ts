// @java Evaluation/src/experiments/fastGameLengths/FastGameLengths.java

/**
 * Experiments to test Heuristic Sampling for fast game length estimates.
 *
 * @java experiments/fastGameLengths/FastGameLengths.java
 * @author cambolbro
 */

import { TrialRecord } from "./TrialRecord.js";
import { Stats } from "../../../../Common/src/main/math/statistics/Stats.js";

/** Minimal escape-hatch for not-yet-ported Game */
interface Game {
  players(): { count(): number };
  name(): string;
  start(context: Context): void;
  playout(
    context: Context,
    ais: unknown,
    maxSeconds: number,
    randomiser: unknown,
    n1: number,
    n2: number,
    rng: unknown
  ): Trial;
  disableMemorylessPlayouts(): void;
}

/** Minimal escape-hatch for not-yet-ported Trial */
interface Trial {
  over(): boolean;
  numTurns(): number;
  numForcedPasses(): number;
  numMoves(): number;
  numInitialPlacementMoves(): number;
  status(): { winner(): number };
  auxilTrialData(): { legalMovesHistorySizes(): IntList };
  storeLegalMovesHistorySizes(): void;
}

/** Minimal escape-hatch for not-yet-ported Context */
interface Context {
  model(): Model;
  trial(): Trial;
}

/** Minimal escape-hatch for not-yet-ported Model */
interface Model {
  startNewStep(
    context: Context,
    ais: unknown[],
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number,
    alpha: number
  ): void;
}

/** Minimal escape-hatch for not-yet-ported AI */
interface AI {
  initAI(game: Game, playerID: number): void;
  setFriendlyName(name: string): void;
}

/** Minimal escape-hatch for an int list */
interface IntList {
  size(): number;
  getQuick(index: number): number;
}

// Escape-hatch stubs for not-yet-ported Java dependencies
const GameLoader = {} as unknown as {
  loadGameFromName(name: string, options?: string[]): Game;
};

const MCTS = {} as unknown as {
  createUCT(): AI;
};

const HeuristicSamplingFactory = {} as unknown as {
  new(path: string): AI & { setThreshold(n: number): void; setContinuation(b: boolean): void };
};

const AlphaBetaSearchFactory = {} as unknown as {
  new(path: string): AI;
};

// Max players constant from Java Constants.MAX_PLAYERS
const MAX_PLAYERS = 32;

//-----------------------------------------------------------------------------

// Expected game lengths are from the Game Complexity wikipedia page:
// https://en.wikipedia.org/wiki/Game_complexity
// -1 means average game length is not know for this game.

/**
 * Enum of game names with associated search depth and expected game length.
 * @java FastGameLengths.GameName
 */
export enum GameName {
  //ArdRi = "ArdRi",
  Breakthrough = "Breakthrough",
  //Hnefatafl = "Hnefatafl",
  //Oware = "Oware",
  //Tablut = "Tablut",
  //Reversi = "Reversi",
  //Quoridor = "Quoridor",
  //Go = "Go",
  //Hex = "Hex",
  //Connect6 = "Connect6",
  //Domineering = "Domineering",
  //Amazons = "Amazons",
  //Fanorona = "Fanorona",
  //Yavalath = "Yavalath",
  NineMensMorris = "NineMensMorris",
  TicTacToe = "TicTacToe",
  ConnectFour = "ConnectFour",
  EnglishDraughts = "EnglishDraughts",
  GoMoku = "GoMoku",
  LinesOfAction = "LinesOfAction",
  Halma = "Halma",
  Chess = "Chess",
  Shogi = "Shogi",
}

/** @java FastGameLengths.GameName.depth */
const GAME_NAME_DEPTH: Record<GameName, number> = {
  [GameName.Breakthrough]: 2,
  [GameName.NineMensMorris]: 3,
  [GameName.TicTacToe]: 3,
  [GameName.ConnectFour]: 3,
  [GameName.EnglishDraughts]: 3,
  [GameName.GoMoku]: 3,
  [GameName.LinesOfAction]: 3,
  [GameName.Halma]: 3,
  [GameName.Chess]: 3,
  [GameName.Shogi]: 3,
};

/** @java FastGameLengths.GameName.expected */
const GAME_NAME_EXPECTED: Record<GameName, number> = {
  [GameName.Breakthrough]: -1,
  [GameName.NineMensMorris]: 50,
  [GameName.TicTacToe]: 9,
  [GameName.ConnectFour]: 36,
  [GameName.EnglishDraughts]: 70,
  [GameName.GoMoku]: 30,
  [GameName.LinesOfAction]: 44,
  [GameName.Halma]: -1,
  [GameName.Chess]: 70,
  [GameName.Shogi]: 115,
};

//-----------------------------------------------------------------------------

/**
 * Experiments to test Heuristic Sampling for fast game length estimates.
 *
 * @java experiments/fastGameLengths/FastGameLengths.java
 */
export class FastGameLengths {

  /** @java FastGameLengths.output */
  private readonly output: string[] = [];

  /** @java FastGameLengths.df — Decimal format for printing */
  private static readonly df = {
    format(n: number): string {
      return n.toFixed(3);
    },
  };

  //-------------------------------------------------------------------------

  /** @java FastGameLengths.test() */
  test(): void {
    //test(GameName.NineMensMorris);

    const names = Object.values(GameName);
    for (const gameName of names) {
      //if (gameName.ordinal() >= GameName.EnglishDraughts.ordinal())
      //if (gameName.ordinal() >= GameName.Shogi.ordinal())
      if (names.indexOf(gameName) >= names.indexOf(GameName.Breakthrough)) {
        this.testGame(gameName);
      }
      //break;
    }
  }

  /** @java FastGameLengths.test(GameName) */
  testGame(gameName: GameName): void {
    let game: Game | null = null;

    switch (gameName) {
    case GameName.NineMensMorris:
      game = GameLoader.loadGameFromName("Nine Men's Morris.lud");
      break;
    case GameName.Chess:
      game = GameLoader.loadGameFromName("Chess.lud");
      break;
    case GameName.ConnectFour:
      game = GameLoader.loadGameFromName("Connect Four.lud");
      break;
    case GameName.EnglishDraughts:
      game = GameLoader.loadGameFromName("English Draughts.lud");
      break;
    case GameName.GoMoku:
      game = GameLoader.loadGameFromName("GoMoku.lud");
      break;
    case GameName.Halma:
      game = GameLoader.loadGameFromName("Halma.lud", ["Board Size/6x6"]);
      break;
    case GameName.Breakthrough:
      game = GameLoader.loadGameFromName("Breakthrough.lud", ["Board Size/6x6"]);
      break;
    case GameName.LinesOfAction:
      game = GameLoader.loadGameFromName("Lines of Action.lud");
      break;
    case GameName.Shogi:
      game = GameLoader.loadGameFromName("Shogi.lud");
      break;
    case GameName.TicTacToe:
      game = GameLoader.loadGameFromName("Tic-Tac-Toe.lud");
      break;
    }

    if (game === null) return;

    console.log("==================================================");
    console.log("Loaded game " + game.name() + ", " + GAME_NAME_EXPECTED[gameName] + " moves expected.");

    this.output.length = 0;

    this.output.push("   [");
    this.output.push("      [ (" + game.name() + ") " + GAME_NAME_EXPECTED[gameName] + " ]");

    try {
//			lengthRandomParallel(game, 100);
//
//			console.log("BF (parallel) = " + branchingFactorParallel(game, 10));

      let threshold = 2;
      for (let hs = 0; hs < 4; hs++) {
        this.lengthHS(gameName, game, threshold, true);
        threshold *= 2;
      }

//			if
//			(
//				gameName == GameName.NineMensMorris
//				||
//				gameName == GameName.EnglishDraughts
//			)
//			{
//				// Repeat without HS continuation
//				threshold = 2;
//				for (let hs = 0; hs < 4; hs++)
//				{
//					lengthHS(gameName, game, threshold, false);
//					threshold *= 2;
//				}
//			}
//
//			for (let depth = 1; depth <= 2; depth++)
//			//for (let depth = 1; depth <= gameName.depth(); depth++)
//				lengthAlphaBeta(gameName, game, depth);

      this.lengthAlphaBeta(gameName, game, 3);

      this.lengthUCT(gameName, game, 1000);

      //compareUCThs(gameName, game, 1000);
    } catch (e) {
      console.error(e);
    }

    this.output.push("   ]");

    for (const str of this.output) {
      console.log(str);
    }
  }

  //-------------------------------------------------------------------------

  /** @java FastGameLengths.gameLength(Trial, Game) */
  public gameLength(trial: Trial, _game: Game): number {
    //return trial.numLogicalDecisions(game);
    //return trial.numMoves() - trial.numForcedPasses();
    return trial.numTurns() - trial.numForcedPasses();
  }

  //-------------------------------------------------------------------------

  /**
   * @param game Single game object shared between threads.
   * @java FastGameLengths.compareUCThs(GameName, Game, int)
   */
  async compareUCThs(
    gameName: GameName,
    game: Game,
    iterations: number,
  ): Promise<void> {
    const MaxTrials = 1000;

    const startAt = Date.now();

    let aiA: AI | null = null;
    let aiB: AI | null = null;

    console.log("\nUCT (" + iterations + " iterations).");

    const futures: Promise<TrialRecord>[] = [];

    for (let t = 0; t < MaxTrials; t++) {
      const starter = t % 2;

      const ais: (AI | null)[] = [null];  // null placeholder for player 0

      const heuristicsFilePath = "src/experiments/fastGameLengths/Heuristics_" + gameName + "_Good.txt";
      try {
        //aiA = new AlphaBetaSearch(heuristicsFilePath);
        aiA = MCTS.createUCT();

        aiB = new (HeuristicSamplingFactory as unknown as { new(p: string): AI & { setThreshold(n: number): void; setContinuation(b: boolean): void } })(heuristicsFilePath);
        (aiB as unknown as { setFriendlyName(n: string): void }).setFriendlyName("UCThs");
      } catch (e) {
        console.error(e);
      }

      if (starter === 0) {
        ais.push(aiA);
        ais.push(aiB);
      } else {
        ais.push(aiB);
        ais.push(aiA);
      }

      futures.push(
        new Promise<TrialRecord>((resolve) => {
          const trial = {} as unknown as Trial;
          const context = {} as unknown as Context;

          game.start(context);

          for (let p = 1; p <= game.players().count(); ++p) {
            ais[p]!.initAI(game, p);
          }

          const model = context.model();
          while (!trial.over()) {
            model.startNewStep(context, ais, -1, iterations, -1, 0);
          }

          const status = context.trial().status();
          process.stdout.write(String(status.winner()));

          resolve(new TrialRecord(starter, trial));
        })
      );
    }

    const records = await Promise.all(futures);

    const secs = (Date.now() - startAt) / 1000.0;
    console.log("UCT (" + iterations + ") " + secs + "s (" + (secs / MaxTrials) + "s per game).");

    await this.showResults(game, "UCThs Results", MaxTrials, records, secs);
  }

  //-------------------------------------------------------------------------

  /**
   * @param game Single game object shared between threads.
   * @java FastGameLengths.lengthUCT(GameName, Game, int)
   */
  async lengthUCT(
    gameName: GameName,
    game: Game,
    iterations: number,
  ): Promise<void> {
    const MaxTrials = 10;  //100;  //10;

    const startAt = Date.now();

    let aiA: AI | null = null;
    let aiB: AI | null = null;

    console.log("\nUCT (" + iterations + " iterations).");

    const futures: Promise<TrialRecord>[] = [];

    for (let t = 0; t < MaxTrials; t++) {
      const starter = t % 2;

      const ais: (AI | null)[] = [null];  // null placeholder for player 0

      aiA = MCTS.createUCT();
      aiB = MCTS.createUCT();

      if (starter === 0) {
        ais.push(aiA);
        ais.push(aiB);
      } else {
        ais.push(aiB);
        ais.push(aiA);
      }

      const capturedAis = ais.slice();
      const capturedStarter = starter;

      //futures.add(future.runTrial(executor, game, ais, starter, iterations));
      futures.push(
        new Promise<TrialRecord>((resolve) => {
          const trial = {} as unknown as Trial;
          const context = {} as unknown as Context;

          game.start(context);

          for (let p = 1; p <= game.players().count(); ++p) {
            capturedAis[p]!.initAI(game, p);
          }

          const model = context.model();
          while (!trial.over()) {
            model.startNewStep(context, capturedAis, -1, iterations, -1, 0);
          }

          const status = context.trial().status();
          process.stdout.write(String(status.winner()));

          resolve(new TrialRecord(capturedStarter, trial));
        })
      );
    }

    const records = await Promise.all(futures);

    const secs = (Date.now() - startAt) / 1000.0;
    console.log("\nUCT (" + iterations + ") " + secs + "s (" + (secs / MaxTrials) + "s per game).");

    await this.showResults(game, "UCT", MaxTrials, records, secs);
    void gameName;
  }

  //-------------------------------------------------------------------------

  /**
   * @param game Single game object shared between threads.
   * @java FastGameLengths.lengthHS(GameName, Game, int, boolean)
   */
  readonly lengthHS = async (
    gameName: GameName,
    game: Game,
    fraction: number,
    continuation: boolean,
  ): Promise<void> => {
    const MaxTrials = 100;

    const startAt = Date.now();

    let aiA: (AI & { setThreshold(n: number): void; setContinuation(b: boolean): void }) | null = null;
    let aiB: (AI & { setThreshold(n: number): void; setContinuation(b: boolean): void }) | null = null;

    //console.log("\nHS (1/" + fraction + ")" + (continuation ? "*" : "") + ".");
    const label = "HS 1/" + fraction + (continuation ? "" : "-");
    console.log("\n" + label + ":");

    const futures: Promise<TrialRecord>[] = [];

    for (let t = 0; t < MaxTrials; t++) {
      const starter = t % 2;

      const ais: (AI | null)[] = [null];  // null placeholder for player 0

      const heuristicsFilePath = "src/experiments/fastGameLengths/Heuristics_" + gameName + "_Good.txt";
      aiA = new (HeuristicSamplingFactory as unknown as { new(p: string): AI & { setThreshold(n: number): void; setContinuation(b: boolean): void } })(heuristicsFilePath);
      aiB = new (HeuristicSamplingFactory as unknown as { new(p: string): AI & { setThreshold(n: number): void; setContinuation(b: boolean): void } })(heuristicsFilePath);

      aiA.setThreshold(fraction);
      aiB.setThreshold(fraction);

      aiA.setContinuation(continuation);
      aiB.setContinuation(continuation);

      if (t % 2 === 0) {
        ais.push(aiA);
        ais.push(aiB);
      } else {
        ais.push(aiB);
        ais.push(aiA);
      }

      const capturedAis = ais.slice();
      const capturedStarter = starter;

      futures.push(
        new Promise<TrialRecord>((resolve) => {
          const trial = {} as unknown as Trial;
          const context = {} as unknown as Context;

          game.start(context);

          for (let p = 1; p <= game.players().count(); ++p) {
            capturedAis[p]!.initAI(game, p);
          }

          const model = context.model();
          while (!trial.over()) {
            model.startNewStep(context, capturedAis, -1, -1, 1, 0);
          }

          resolve(new TrialRecord(capturedStarter, trial));
        })
      );
    }

    const records = await Promise.all(futures);

    const secs = (Date.now() - startAt) / 1000.0;
    console.log("Heuristic Sampling (1/" + fraction + ") " + secs + "s (" + (secs / MaxTrials) + "s per game).");

    await this.showResults(game, label, MaxTrials, records, secs);
  };

  //-------------------------------------------------------------------------

  /**
   * @param game Single game object shared between threads.
   * @java FastGameLengths.lengthAlphaBeta(GameName, Game, int)
   */
  async lengthAlphaBeta(
    gameName: GameName,
    game: Game,
    depth: number,
  ): Promise<void> {
    const MaxTrials = 10;  //100;

    const startAt = Date.now();

    let aiA: AI | null = null;
    let aiB: AI | null = null;

    const label = "AB " + depth;
    console.log("\n" + label + ":");

    const futures: Promise<TrialRecord>[] = [];

    for (let t = 0; t < MaxTrials; t++) {
      const starter = t % 2;

      const ais: (AI | null)[] = [null];  // null placeholder for player 0

      const heuristicsFilePath = "src/experiments/fastGameLengths/Heuristics_" + gameName + "_Good.txt";
      aiA = new (AlphaBetaSearchFactory as unknown as { new(p: string): AI })(heuristicsFilePath);
      aiB = new (AlphaBetaSearchFactory as unknown as { new(p: string): AI })(heuristicsFilePath);
      //aiB = new AlphaBetaSearch("src/experiments/fastGameLengths/Heuristics_Tablut_Current.txt");

      if (t % 2 === 0) {
        ais.push(aiA);
        ais.push(aiB);
      } else {
        ais.push(aiB);
        ais.push(aiA);
      }

      const capturedAis = ais.slice();
      const capturedStarter = starter;

      futures.push(
        new Promise<TrialRecord>((resolve) => {
          const trial = {} as unknown as Trial;
          const context = {} as unknown as Context;

          game.start(context);

          for (let p = 1; p <= game.players().count(); ++p) {
            capturedAis[p]!.initAI(game, p);
          }

          const model = context.model();
          while (!trial.over()) {
            model.startNewStep(context, capturedAis, -1, -1, depth, 0);
          }

          resolve(new TrialRecord(capturedStarter, trial));
        })
      );
    }

    const records = await Promise.all(futures);

    const secs = (Date.now() - startAt) / 1000.0;
    console.log("Alpha-Beta (" + depth + ") in " + secs + "s (" + (secs / MaxTrials) + "s per game).");

    await this.showResults(game, label, MaxTrials, records, secs);
  }

  //-------------------------------------------------------------------------

  /** @java FastGameLengths.showResults(Game, String, int, List<Future<TrialRecord>>, double) */
  async showResults(
    game: Game,
    label: string,
    numTrials: number,
    records: TrialRecord[],
    secs: number,
  ): Promise<void> {
    // Accumulate wins per player
    const stats = new Stats(label);
    const results: number[] = new Array(MAX_PLAYERS + 1).fill(0);

    for (let t = 0; t < numTrials; t++) {
      const trialRecord = records[t]!;
      const trial = trialRecord.trial() as unknown as Trial;

      const length = this.gameLength(trial, game);

      //console.log((t == 0 ? "\n" : "") + length + " ");

      if (length < 1000) {
        stats.addSample(this.gameLength(trial, game));
      }

      const result = trial.status().winner();  //futures.get(t).get().intValue();
      if (result === 0) {
        // Draw: share win
        results[0]! += 0.5;
        results[1]! += 0.5;
      } else {
        // Reward winning AI
        if (trialRecord.starter() === 0) {
          if (result === 1) {
            results[0]!++;
          } else {
            results[1]!++;
          }
        } else {
          if (result === 1) {
            results[1]!++;
          } else {
            results[0]!++;
          }
        }
      }

      //console.log(trialRecord.starter() + " => " + trial.status().winner());
    }

    //console.log("\naiA=" + results[0] + ", aiB=" + results[1] + ".");
    console.log("aiA success rate " + results[0]! / numTrials * 100 + "%.");  //+ ", aiB=" + results[1] + ".");

    stats.measure();
    stats.showFull();

    this.formatOutput(stats, numTrials, secs);

    //console.log("Expected length is " + (gameName.expected() == -1 ? "not known" : gameName.expected()) + ".");
  }

  //-------------------------------------------------------------------------

  /** @java FastGameLengths.lengthRandomSerial(Game, int) */
  lengthRandomSerial(game: Game, numTrials: number): number {
    const startAt = Date.now();

    const refTrial = {} as unknown as Trial;
    const context = {} as unknown as Context;
    void refTrial;

    const stats = new Stats("Serial Random");

    //let totalLength = 0;
    for (let t = 0; t < numTrials; t++) {
      game.start(context);
      const trial = game.playout(context, null, 1.0, null, -1, -1, null);
      //totalLength += trial.numLogicalDecisions(game);
      stats.addSample(this.gameLength(trial, game));
    }
    stats.measure();

    const secs = (Date.now() - startAt) / 1000.0;

    stats.showFull();
    console.log("Serial in " + secs + "s.");

    return stats.getMean();
  }

  /** @java FastGameLengths.lengthRandomParallel(Game, int) */
  async lengthRandomParallel(game: Game, numTrials: number): Promise<number> {
    const startAt = Date.now();

    const futures: Promise<Trial>[] = [];

    for (let t = 0; t < numTrials; t++) {
      const trial = {} as unknown as Trial;
      const context = {} as unknown as Context;
      //trial.storeLegalMovesHistorySizes();

      futures.push(
        new Promise<Trial>((resolve) => {
          game.start(context);
          game.playout(context, null, 1.0, null, -1, -1, null);
          resolve(trial);
        })
      );
    }

    const trials = await Promise.all(futures);

    // Accumulate lengths over all trials
    const label = "Random";
    const stats = new Stats(label);

    //let totalLength = 0;
    for (let t = 0; t < numTrials; t++) {
      const trial = trials[t]!;
      stats.addSample(this.gameLength(trial, game));
    }

    stats.measure();

    const secs = (Date.now() - startAt) / 1000.0;

    stats.showFull();
    console.log("Random concurrent in " + secs + "s (" + (secs / numTrials) + "s per game).");

    this.formatOutput(stats, numTrials, secs);

    return stats.getMean();
  }

  /** @java FastGameLengths.formatOutput(Stats, int, double) */
  formatOutput(stats: Stats, numTrials: number, secs: number): void {
    this.output.push(
      "      [ (" + stats.getLabel() + ") " + stats.n() + " " + FastGameLengths.df.format(stats.getMean())
      +
      " " + Math.floor(stats.getMin()) + " " + Math.floor(stats.getMax())
      +
      " " + FastGameLengths.df.format(stats.sd()) + " " + FastGameLengths.df.format(stats.se()) + " " + FastGameLengths.df.format(stats.getCi())
      +
      " " + FastGameLengths.df.format(secs / numTrials * 1000.0)
      +
      " ]"
    );
  }

  //-------------------------------------------------------------------------

  /** @java FastGameLengths.branchingFactorParallel(Game, int) */
  static async branchingFactorParallel(
    game: Game,
    numTrials: number,
  ): Promise<number> {
    // Disable custom playouts that cannot properly store history of legal moves per state
    game.disableMemorylessPlayouts();

    const futures: Promise<Trial>[] = [];

    for (let t = 0; t < numTrials; t++) {
      const trial = {} as unknown as Trial;
      const context = {} as unknown as Context;
      trial.storeLegalMovesHistorySizes();

      futures.push(
        new Promise<Trial>((resolve) => {
          game.start(context);
          game.playout(context, null, 1.0, null, -1, -1, null);
          resolve(trial);
        })
      );
    }

    const trials = await Promise.all(futures);

    // Accumulate total BFs over all trials
    let totalBF = 0;
    for (let t = 0; t < numTrials; t++) {
      const trial = trials[t]!;

      const branchingFactors = trial.auxilTrialData().legalMovesHistorySizes();

      let bfAcc = 0;
      if (branchingFactors.size() > 0) {
        for (let m = 0; m < branchingFactors.size(); m++) {
          bfAcc += branchingFactors.getQuick(m);
        }
        bfAcc /= branchingFactors.size();
      }
      totalBF += bfAcc;
    }

    return totalBF / numTrials;
  }

  //-------------------------------------------------------------------------

  /** @java FastGameLengths.main(String[]) */
  public static main(_args: string[]): void {
    const sd = new FastGameLengths();
    sd.test();
  }

  //-------------------------------------------------------------------------
}

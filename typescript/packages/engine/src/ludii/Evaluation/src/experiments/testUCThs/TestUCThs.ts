// @java Evaluation/src/experiments/testUCThs/TestUCThs.java

/**
 * Experiments to test Heuristic Sampling for fast game length estimates.
 *
 * @java experiments/testUCThs/TestUCThs.java
 * @author cambolbro
 */

import { TrialRecord } from "../fastGameLengths/TrialRecord.js";
import { Stats } from "../../../../Common/src/main/math/statistics/Stats.js";

/** Minimal escape-hatch for not-yet-ported Game */
interface Game {
  players(): { count(): number };
  name(): string;
  start(context: Context): void;
  moves(context: Context): { count(): number };
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
  state(): { playerToAgent(p: number): number; mover(): number };
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
  friendlyName(): string;
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

const AlphaBetaSearch = {} as unknown as {
  new(path: string): AI;
};

const HeuristicPlayout = {} as unknown as { new(path: string): unknown };
const UCB1 = {} as unknown as { new(): unknown };
const MonteCarloBackprop = {} as unknown as { new(): unknown };
const RobustChild = {} as unknown as { new(): unknown };
const MCTSConstructor = {} as unknown as {
  new(sel: unknown, playout: unknown, backprop: unknown, final: unknown): AI;
};

// Max players constant from Java Constants.MAX_PLAYERS
const MAX_PLAYERS = 32;

//-----------------------------------------------------------------------------

/**
 * Experiments to test Heuristic Sampling for fast game length estimates.
 *
 * @java experiments/testUCThs/TestUCThs.java
 */
export class TestUCThs {

  // Expected game lengths are from the Game Complexity wikipedia page:
  // https://en.wikipedia.org/wiki/Game_complexity
  // -1 means average game length is not know for this game.

  /** @java TestUCThs.output */
  private readonly output: string[] = [];

  /** @java TestUCThs.df — Decimal format for printing */
  private static readonly df = {
    format(n: number): string {
      return n.toFixed(3);
    },
  };

  //-------------------------------------------------------------------------

  /**
   * @java TestUCThs.GameName
   */
  // enum values with depth and expected:
  // Breakthrough(2, -1), Tablut(4, -1), Yavalath(4, -1), Clobber(3, -1),
  // NineMensMorris(3, 50), TicTacToe(3, 9), ConnectFour(3, 36),
  // EnglishDraughts(3, 70), GoMoku(3, 30), LinesOfAction(3, 44),
  // Halma(3, -1), Chess(3, 70), Shogi(3, 115)

  public static readonly GAME_DEPTHS: Record<string, number> = {
    Breakthrough: 2,
    Tablut: 4,
    Yavalath: 4,
    Clobber: 3,
    NineMensMorris: 3,
    TicTacToe: 3,
    ConnectFour: 3,
    EnglishDraughts: 3,
    GoMoku: 3,
    LinesOfAction: 3,
    Halma: 3,
    Chess: 3,
    Shogi: 3,
  };

  public static readonly GAME_EXPECTED: Record<string, number> = {
    Breakthrough: -1,
    Tablut: -1,
    Yavalath: -1,
    Clobber: -1,
    NineMensMorris: 50,
    TicTacToe: 9,
    ConnectFour: 36,
    EnglishDraughts: 70,
    GoMoku: 30,
    LinesOfAction: 44,
    Halma: -1,
    Chess: 70,
    Shogi: 115,
  };

  //-------------------------------------------------------------------------

  /** @java TestUCThs.test() */
  test(): void {
//		test(GameName.TicTacToe);
//		test(GameName.Yavalath);
//		test(GameName.Tablut);
//		test(GameName.Halma);
//		test(GameName.NineMensMorris);
//		test(GameName.Breakthrough);
    this.testGame("ConnectFour");
//		test(GameName.Clobber);

//		for (final GameName gameName : GameName.values())
//			test(gameName);
  }

  /** @java TestUCThs.test(GameName) */
  async testGame(gameName: string): Promise<void> {
    let game: Game | null = null;

    switch (gameName) {
    case "Tablut":
      game = GameLoader.loadGameFromName("Tablut.lud");
      break;
    case "Yavalath":
      game = GameLoader.loadGameFromName("Yavalath.lud");  //, Arrays.asList("Board Size/4x4"));
      break;
    case "Clobber":
      game = GameLoader.loadGameFromName("Clobber.lud", ["Rows/6", "Columns/6"]);
      break;
    case "NineMensMorris":
      game = GameLoader.loadGameFromName("Nine Men's Morris.lud");
      break;
    case "Chess":
      game = GameLoader.loadGameFromName("Chess.lud");
      break;
    case "ConnectFour":
      game = GameLoader.loadGameFromName("Connect Four.lud");
      break;
    case "EnglishDraughts":
      game = GameLoader.loadGameFromName("English Draughts.lud");
      break;
    case "GoMoku":
      game = GameLoader.loadGameFromName("GoMoku.lud");
      break;
    case "Halma":
      game = GameLoader.loadGameFromName("Halma.lud", ["Board Size/6x6"]);
      break;
    case "Breakthrough":
      game = GameLoader.loadGameFromName("Breakthrough.lud", ["Board Size/6x6"]);
      break;
    case "LinesOfAction":
      game = GameLoader.loadGameFromName("Lines of Action.lud");
      break;
    case "Shogi":
      game = GameLoader.loadGameFromName("Shogi.lud");
      break;
    case "TicTacToe":
      game = GameLoader.loadGameFromName("Tic-Tac-Toe.lud");
      break;
    }

    if (game === null) return;

    console.log("==================================================");
    console.log("Loaded game " + game.name() + ".");

    this.output.length = 0;

    this.output.push("   [");
    this.output.push("      [ (" + game.name() + ") ]");

    try {
      const depth = 4;
      const bf = await TestUCThs.branchingFactorParallel(game, 10);
      const fullMinimax = Math.floor(Math.pow(bf, depth) + 0.5);    // similar to N-ply minimax search
      const iterations = Math.floor(Math.sqrt(fullMinimax) + 0.5);  // similar to N-ply AB search

      console.log("depth=" + depth + ", BF=" + bf + ", iterations=" + iterations + ".");

      TestUCThs.compareUCThs(gameName, game, iterations, depth);
    } catch (e) {
      console.error(e);
    }

    this.output.push("   ]");

    for (const str of this.output) {
      console.log(str);
    }
  }

  //-------------------------------------------------------------------------

  /** @java TestUCThs.gameLength(Trial, Game) */
  public static gameLength(trial: Trial, _game: Game): number {
    //return trial.numLogicalDecisions(game);
    //return trial.numMoves() - trial.numForcedPasses();
    return trial.numTurns() - trial.numForcedPasses();
  }

  //-------------------------------------------------------------------------

  /**
   * @param game Single game object shared between threads.
   * @java TestUCThs.compareUCThs(GameName, Game, int, int)
   */
  static async compareUCThs(
    gameName: string,
    game: Game,
    iterations: number,
    depth: number,
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
        aiA = new AlphaBetaSearch(heuristicsFilePath);
        //aiA = MCTS.createUCT();
        //aiA = new RandomAI();

        //aiB = MCTS.createUCT();

//				aiA = new MCTS
//					  (
//						  new UCB1(),
//						  new HeuristicPlayout(heuristicsFilePath),
//						  new RobustChild()
//					  );
//				aiA.setFriendlyName("UCThs1/1");

        aiB = new MCTSConstructor(
          new UCB1(),
          new HeuristicPlayout(heuristicsFilePath),
          new MonteCarloBackprop(),
          new RobustChild(),
        );
        aiB.setFriendlyName("UCThs1/1");

        //aiB = new RandomAI();
      } catch (e) {
        console.error(e);
      }

      // Alternate which AI starts
      if (starter === 0) {
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
            model.startNewStep(context, capturedAis, -1, iterations, depth, 0);
          }

          const status = context.trial().status();
          process.stdout.write(String(status.winner()));

          resolve(new TrialRecord(capturedStarter, trial));
        })
      );
    }

    const records = await Promise.all(futures);

    const secs = (Date.now() - startAt) / 1000.0;
    console.log("UCT (" + iterations + ") " + secs + "s (" + (secs / MaxTrials) + "s per game).");

    await TestUCThs.showResults(game, "UCThs Results", MaxTrials, records, secs, aiA!, aiB!);
  }

  //-------------------------------------------------------------------------

  /** @java TestUCThs.showResults(Game, String, int, List<Future<TrialRecord>>, double, AI, AI) */
  static async showResults(
    _game: Game,
    label: string,
    numTrials: number,
    records: TrialRecord[],
    _secs: number,
    aiA: AI,
    aiB: AI,
  ): Promise<void> {
    // Accumulate wins per player
    const statsA = new Stats(label);
    const statsB = new Stats(label);
    const results: number[] = new Array(MAX_PLAYERS + 1).fill(0);

    for (let t = 0; t < numTrials; t++) {
      const trialRecord = records[t]!;
      const trial = trialRecord.trial() as unknown as Trial;

      //const length = gameLength(trial, game);

      //console.log((t === 0 ? "\n" : "") + length + " ");

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

      let resultA = 0;
      let resultB = 0;

      if (result === 0) {
        // Draw
        resultA = 0.5;
        resultB = 0.5;
      } else {
        if (trialRecord.starter() === 0) {
          if (result === 1) {
            resultA = 1;
          } else {
            resultB = 1;
          }
        } else {
          if (result === 1) {
            resultB = 1;
          } else {
            resultA = 1;
          }
        }
      }

      statsA.addSample(resultA);
      statsB.addSample(resultB);

      //console.log(trialRecord.starter() + " => " + trial.status().winner());
    }

    //console.log("\naiA=" + results[0] + ", aiB=" + results[1] + ".");
    console.log(aiA.friendlyName() + " success rate " + results[0]! * 100.0 / numTrials + "%.");  //+ ", aiB=" + results[1] + ".";
    console.log(aiB.friendlyName() + " success rate " + results[1]! * 100.0 / numTrials + "%.");  //+ ", aiB=" + results[1] + ".";

    statsA.measure();
    process.stdout.write(aiA.friendlyName());
    statsA.showFull();

    statsB.measure();
    process.stdout.write(aiB.friendlyName());
    statsB.showFull();

    //formatOutput(stats, numTrials, secs);

    //console.log("Expected length is " + (gameName.expected() == -1 ? "not known" : gameName.expected()) + ".");
  }

  //-------------------------------------------------------------------------

  /** @java TestUCThs.lengthRandomSerial(Game, int) */
  static lengthRandomSerial(game: Game, numTrials: number): number {
    const startAt = Date.now();

    const refTrial = {} as unknown as Trial;
    const context = {} as unknown as Context;
    void refTrial;

    const stats = new Stats("Serial Random");

    //int totalLength = 0;
    for (let t = 0; t < numTrials; t++) {
      game.start(context);
      const trial = game.playout(context, null, 1.0, null, -1, -1, null);
      //totalLength += trial.numLogicalDecisions(game);
      stats.addSample(TestUCThs.gameLength(trial, game));
    }
    stats.measure();

    const secs = (Date.now() - startAt) / 1000.0;

    stats.showFull();
    console.log("Serial in " + secs + "s.");

    return stats.getMean();
  }

  /** @java TestUCThs.lengthRandomParallel(Game, int) */
  async lengthRandomParallel(game: Game, numTrials: number): Promise<number> {
    const startAt = Date.now();

    const futures: Promise<Trial>[] = [];

    const latchCount = { n: numTrials };
    void latchCount;

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
      stats.addSample(TestUCThs.gameLength(trial, game));
    }

    stats.measure();

    const secs = (Date.now() - startAt) / 1000.0;

    stats.showFull();
    console.log("Random concurrent in " + secs + "s (" + (secs / numTrials) + "s per game).");

    this.formatOutput(stats, numTrials, secs);

    return stats.getMean();
  }

  //-------------------------------------------------------------------------

  /** @java TestUCThs.formatOutput(Stats, int, double) */
  formatOutput(stats: Stats, numTrials: number, secs: number): void {
    this.output.push(
      "      [ (" + stats.getLabel() + ") " + stats.n() + " " + TestUCThs.df.format(stats.getMean())
      +
      " " + Math.floor(stats.getMin()) + " " + Math.floor(stats.getMax())
      +
      " " + TestUCThs.df.format(stats.sd()) + " " + TestUCThs.df.format(stats.se()) + " " + TestUCThs.df.format(stats.getCi())
      +
      " " + TestUCThs.df.format(secs / numTrials * 1000.0)
      +
      " ]"
    );
  }

  //-------------------------------------------------------------------------

//	static branchingFactorSerial(game: Game, numTrials: number): number
//	{
//		const startAt = Date.now();
//
//		const trial = new Trial(game);
//		const context = new Context(game, trial);
//
//		let totalDecisions = 0;
//
//		for (let t = 0; t < numTrials; t++)
//		{
//			game.start(context);
//			const endTrial = game.playout(context, null, 1.0, null, -1, -1, null);
//			const numDecisions = endTrial.numMoves() - endTrial.numInitialPlacementMoves();
//			totalDecisions += numDecisions;
//		}
//
//		const secs = (Date.now() - startAt) / 1000.0;
//		console.log("BF serial in " + secs + "s.");
//
//		return totalDecisions / numTrials;
//	}

  /** @java TestUCThs.branchingFactorParallel(Game, int) */
  static async branchingFactorParallel(
    game: Game,
    numTrials: number,
  ): Promise<number> {
    //const startAt = Date.now();

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

    //const secs = (Date.now() - startAt) / 1000.0;
    //console.log("secs=" + secs);

    return totalBF / numTrials;
  }

  //-------------------------------------------------------------------------

  /** @java TestUCThs.main(String[]) */
  public static main(_args: string[]): void {
    const app = new TestUCThs();
    app.test();
  }

  //-------------------------------------------------------------------------
}

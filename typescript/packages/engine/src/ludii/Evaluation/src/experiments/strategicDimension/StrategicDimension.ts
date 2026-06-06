// @java Evaluation/src/experiments/strategicDimension/StrategicDimension.java

/**
 * Experiments to test Strategic Dimension.
 *
 * @java experiments/strategicDimension/StrategicDimension.java
 * @author cambolbro
 */

import { FutureTrial } from "./FutureTrial.js";
import { FutureTrialAB } from "./FutureTrialAB.js";

/** Minimal escape-hatch for not-yet-ported Game */
interface Game {
  name(): string;
  players(): { count(): number };
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
}

/** Minimal escape-hatch for not-yet-ported Trial */
interface Trial {
  numMoves(): number;
  numInitialPlacementMoves(): number;
  auxilTrialData(): { legalMovesHistorySizes(): IntList };
  storeLegalMovesHistorySizes(): void;
}

/** Minimal escape-hatch for not-yet-ported Context */
interface Context {
  trial(): Trial;
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

// FutureTrialMC is not in this batch — use an escape-hatch stub
const FutureTrialMCFactory = {} as unknown as { new(): FutureTrial };

//-----------------------------------------------------------------------------

/**
 * Experiments to test Strategic Dimension.
 *
 * @java experiments/strategicDimension/StrategicDimension.java
 */
export class StrategicDimension {

  //-------------------------------------------------------------------------

  /** @java StrategicDimension.test() */
  static test(): void {
    //const game = GameLoader.loadGameFromName("Tic-Tac-Toe.lud");
    //const game = GameLoader.loadGameFromName("Breakthrough.lud");
    //const game = GameLoader.loadGameFromName("Chess.lud");
    //const game = GameLoader.loadGameFromName("Amazons.lud");

    //const game = GameLoader.loadGameFromName("Breakthrough.lud", ["Board Size/4x4"]);
    //const game = GameLoader.loadGameFromName("Breakthrough.lud", ["Board Size/5x5"]);
    //const game = GameLoader.loadGameFromName("Breakthrough.lud", ["Board Size/6x6"]);
    //const game = GameLoader.loadGameFromName("Breakthrough.lud", ["Board Size/7x7"]);
    const game = GameLoader.loadGameFromName("Breakthrough.lud", ["Board Size/8x8"]);
    //const game = GameLoader.loadGameFromName("Breakthrough.lud", ["Board Size/9x9"]);
    //const game = GameLoader.loadGameFromName("Breakthrough.lud", ["Board Size/10x10"]);
    //const game = GameLoader.loadGameFromName("Breakthrough.lud", ["Board Size/11x11"]);
    //const game = GameLoader.loadGameFromName("Breakthrough.lud", ["Board Size/12x12"]);

    //const game = GameLoader.loadGameFromName("Breakthrough (No AI).lud", ["Board Size/4x4"]);
    //const game = GameLoader.loadGameFromName("Breakthrough (No AI).lud", ["Board Size/5x5"]);
    //const game = GameLoader.loadGameFromName("Breakthrough (No AI).lud", ["Board Size/6x6"]);
    //const game = GameLoader.loadGameFromName("Breakthrough (No AI).lud", ["Board Size/7x7"]);
    //const game = GameLoader.loadGameFromName("Breakthrough (No AI).lud", ["Board Size/8x8"]);

    console.log("Game " + game.name() + " loaded.");

//		game.disableMemorylessPlayouts();

    const bf = StrategicDimension.branchingFactorParallel(game);
    console.log("Average branching factor is " + bf + ".");

    // Run pairings
    //const winRates = StrategicDimension.runEpochs(game, bf);
    const winRates = StrategicDimension.runEpochs(game, null);
    console.log("Win rates are: " + winRates);

    // Estimate SD
    // ...
  }

  //-------------------------------------------------------------------------

  /**
   * @param game Single game object shared between threads.
   * @param bf   Average branching factor (null for AB search).
   * @return     List of superior win rates for each epoch.
   * @java StrategicDimension.runEpochs(Game, Double)
   */
  static async runEpochs(game: Game, bf: number | null): Promise<number[]> {
    const NUM_EPOCHS = 4;
    const TRIALS_PER_EPOCH = 50;

    const isMC = (bf !== null);

    const winRates: number[] = [];

    let baseIterations = isMC ? (Math.floor(bf! / 4 + 0.5)) : 0;

    // Generate result for each pairing
    for (let epoch = 0; epoch < NUM_EPOCHS; epoch++) {
      const lower = isMC ? baseIterations : epoch + 1;
      const upper = isMC ? lower * 2 : lower + 1;

      console.log("\nEpoch " + epoch + ": " + lower + " vs " + upper + "...");

      // Run trials concurrently
      const results: Promise<number>[] = [];
      for (let t = 0; t < TRIALS_PER_EPOCH; t++) {
        const future: FutureTrial = isMC ? new FutureTrialMCFactory() : new FutureTrialAB();
        results.push(future.runTrial(game, t, lower, upper));
      }

      // Accumulate win rates for superior agent over all trials
      let winRate = 0;
      try {
        const resolved = await Promise.all(results);
        for (let t = 0; t < TRIALS_PER_EPOCH; t++) {
          winRate += resolved[t]!;
        }
      } catch (e) {
        console.error(e);
      }
      winRate /= TRIALS_PER_EPOCH;
      winRates.push(winRate);
      console.log("\nSuperior win rate is " + winRate + ".");

      // Step to next iteration
      baseIterations = upper;
    }

    return winRates;
  }

  //-------------------------------------------------------------------------

  /** @java StrategicDimension.branchingFactor(Game) */
  static branchingFactor(game: Game): number {
    const NUM_TRIALS = 10;

    //const startAt = Date.now();

    const trial = {} as unknown as Trial;
    const context = {} as unknown as Context;
    void trial;

    let totalDecisions = 0;

    for (let t = 0; t < NUM_TRIALS; t++) {
      game.start(context);
      const endTrial = game.playout(context, null, 1.0, null, -1, -1, null);

      const numDecisions = endTrial.numMoves() - endTrial.numInitialPlacementMoves();
      totalDecisions += numDecisions;
    }

    //const secs = (Date.now() - startAt) / 1000.0;
    //console.log("secs=" + secs);

    return totalDecisions / NUM_TRIALS;
  }

  /** @java StrategicDimension.branchingFactorParallel(Game) */
  static branchingFactorParallel(game: Game): number {
    const NUM_TRIALS = 10;

    //const startAt = Date.now();

    const playedContexts: Promise<Context>[] = [];

    for (let t = 0; t < NUM_TRIALS; t++) {
      const trial = {} as unknown as Trial;
      const context = {} as unknown as Context;
      trial.storeLegalMovesHistorySizes();

      playedContexts.push(
        new Promise<Context>((resolve) => {
          game.start(context);
          game.playout(context, null, 1.0, null, -1, -1, null);
          resolve(context);
        })
      );
    }

    // Accumulate total BFs over all trials
    let totalBF = 0;
    // NOTE: In TS we cannot synchronously await — best-effort synchronous path
    // (Java uses ExecutorService.submit + Future.get synchronously in practice)
    for (let t = 0; t < NUM_TRIALS; t++) {
      // Attempt to extract resolved context via synchronous escape hatch
      const ctxOrPromise = playedContexts[t] as unknown as { _value?: Context };
      const context: Context = ctxOrPromise._value ?? ({} as Context);
      const branchingFactors = context.trial().auxilTrialData().legalMovesHistorySizes();

      let bfAcc = 0;
      for (let m = 0; m < branchingFactors.size(); m++) {
        bfAcc += branchingFactors.getQuick(m);
      }

      const avgBfThisTrial = bfAcc / branchingFactors.size();
      totalBF += avgBfThisTrial;
    }

    //const secs = (Date.now() - startAt) / 1000.0;
    //console.log("secs=" + secs);

    return totalBF / NUM_TRIALS;
  }

  //-------------------------------------------------------------------------

  /** @java StrategicDimension.main(String[]) */
  public static main(_args: string[]): void {
    StrategicDimension.test();
  }

  //-------------------------------------------------------------------------
}

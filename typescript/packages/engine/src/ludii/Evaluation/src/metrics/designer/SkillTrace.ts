// @java Evaluation/src/metrics/designer/SkillTrace.java

/**
 * Skill trace of the game.
 * NOTE. This metric doesn't work with stored trials, and must instead generate new trials each time.
 * NOTE. Only works with games that are supported by UCT.
 *
 * @java metrics/designer/SkillTrace.java
 * @author matthew.stephenson and Dennis Soemers
 */

import { Metric } from "../Metric.js";
import { LinearRegression } from "../../../../Common/src/main/math/LinearRegression.js";

/** Minimal escape-hatch for not-yet-ported Game */
interface Game {
  players(): { count(): number };
  start(context: Context): void;
  moves(context: Context): { count(): number };
  name(): string;
  metadata(): { info(): { getId(): string[] } };
}

/** Minimal escape-hatch for not-yet-ported Trial */
type Trial = unknown;

/** Minimal escape-hatch for not-yet-ported Context */
interface Context {
  state(): { playerToAgent(mover: number): number; mover(): number };
  model(): Model;
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
}

/** Minimal escape-hatch for not-yet-ported RandomProviderState */
type RandomProviderState = unknown;

/** Minimal escape-hatch for not-yet-ported Evaluation */
type Evaluation = unknown;

/** Minimal escape-hatch for not-yet-ported MCTS */
type MCTSFactory = { createUCT(): AI };

/** Minimal escape-hatch for not-yet-ported RankUtils */
type RankUtilsType = { agentUtilities(context: Context): number[] };

// Escape-hatch stubs for not-yet-ported Java dependencies
const MCTS = {} as unknown as MCTSFactory;
const RankUtils = {} as unknown as RankUtilsType;

//-----------------------------------------------------------------------------

/**
 * Skill trace of the game.
 *
 * @java metrics/designer/SkillTrace.java
 */
export class SkillTrace extends Metric {

  /** @java SkillTrace.numMatches — Number of matches (iteration count doubles each time) */
  private numMatches: number = 8;

  /** @java SkillTrace.numTrialsPerMatch — Number of trials per match */
  private numTrialsPerMatch: number = 30;

  /** @java SkillTrace.hardTimeLimit — A hard time limit in seconds, after which any future trials are aborted */
  private hardTimeLimit: number = 180;

  /** @java SkillTrace.outputPath — Output path for more detailed results */
  private outputPath: string = "";

  /** @java SkillTrace.addToDatabaseFile — Database storage option */
  private addToDatabaseFile: boolean = false;

  /** @java SkillTrace.combinedResultsOutputPath */
  private _combinedResultsOutputPath: string = "SkillTraceResults.csv";

  //-------------------------------------------------------------------------

  /**
   * @java SkillTrace()
   */
  public constructor() {
    super(
      "Skill trace",
      "Skill trace of the game.",
      0.0,
      1.0,
      null,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java SkillTrace.apply(Game, Evaluation, Trial[], RandomProviderState[])
   */
  public override apply(
    game: Game,
    _evaluation: Evaluation,
    _trials: Trial[],
    _randomProviderStates: RandomProviderState[],
  ): number | null {
    let outputString = "";

    const strongAIResults: number[] = [];
    let areaEstimate = 0.0;
    const startTime = Date.now();

    const ais: (AI | null)[] = [null];
    for (let p = 1; p <= game.players().count(); ++p) {
      ais.push(MCTS.createUCT());
    }

    const trial = {} as unknown as Trial;
    const context = {} as unknown as Context;
    const trialTyped = trial as unknown as { over(): boolean };
    const trialGame = {} as unknown as { new(game: Game): Trial };
    void trialGame;

    // NOTE: In TS we cannot instantiate Java objects — use escape hatches
    const trialObj = {} as unknown as { over(): boolean };
    const contextObj = context;

    game.start(contextObj);
    const bf = game.moves(contextObj).count();

    console.log(`${this.numTrialsPerMatch} trials per level, time limit ${this.hardTimeLimit}s, BF=${bf}.`);
    outputString += `${this.numTrialsPerMatch} trials per level, time limit ${this.hardTimeLimit}s, BF=${bf}.\n`;

    let weakIterationValue = 2;
    let matchCount = 0;
    for (; matchCount < this.numMatches; matchCount++) {
      let strongAIAvgResult = 0.0;
      let strongAgentIdx = 1;
      for (let i = 0; i < this.numTrialsPerMatch; ++i) {
        game.start(contextObj);

        for (let p = 1; p <= game.players().count(); ++p) {
          ais[p]!.initAI(game, p);
        }

        const model = contextObj.model();

        while (!trialObj.over()) {
          const mover = contextObj.state().playerToAgent(contextObj.state().mover());
          const numIterations = (mover === strongAgentIdx)
            ? weakIterationValue * 2
            : weakIterationValue;

          model.startNewStep(contextObj, ais, -1.0, numIterations * game.moves(contextObj).count(), -1, 0.0);
        }

        // Record the utility of the strong agent
        strongAIAvgResult += RankUtils.agentUtilities(contextObj)[strongAgentIdx]!;

        // Change which player is controlled by the strong agent
        ++strongAgentIdx;
        if (strongAgentIdx > game.players().count()) {
          strongAgentIdx = 1;
        }

        // Check the current time, and if we have elapsed the limit then abort.
        if (Date.now() > (startTime + this.hardTimeLimit * 1000)) {
          break;
        }
      }

      // If we didn't finish all trials in time, then ignore the match results
      if (Date.now() > (startTime + this.hardTimeLimit * 1000)) {
        console.log(`Aborting after ${matchCount} levels.`);
        outputString += `Aborting after ${matchCount} levels.\n`;
        break;
      }

      strongAIAvgResult /= this.numTrialsPerMatch;
      strongAIResults.push(strongAIAvgResult);
      areaEstimate += Math.max(strongAIAvgResult, 0.0);
      weakIterationValue *= 2;

      // Print match results in console
      console.log(`Level ${matchCount + 1}, strong AI result: ${strongAIAvgResult}`);
      outputString += `Level ${matchCount + 1}, strong AI result: ${strongAIAvgResult}\n`;
    }

    // Predict next step y value.
    const xAxis: number[] = Array.from({ length: strongAIResults.length }, (_, i) => i);
    const yAxis: number[] = strongAIResults.slice();
    const linearRegression = new LinearRegression(xAxis, yAxis);
    let yValueNextStep = linearRegression.predict(this.numMatches + 1);
    yValueNextStep = Math.max(Math.min(yValueNextStep, 1.0), 0.0);

    // No matches were able to be completed within the time limit.
    if (matchCount === 0) {
      return 0;
    }

    const skillTrace = yValueNextStep + (1 - yValueNextStep) * (areaEstimate / matchCount);

    const secs = (Date.now() - startTime) / 1000.0;

    console.log(
      `Skill trace ${skillTrace.toFixed(3)} in ${secs.toFixed(3)}s (slope error ${linearRegression.slopeStdErr().toFixed(3)}, intercept error ${linearRegression.interceptStdErr().toFixed(3)}).`
    );
    outputString += `Skill trace ${skillTrace.toFixed(3)} in ${secs.toFixed(3)}s (slope error ${linearRegression.slopeStdErr().toFixed(3)}, intercept error ${linearRegression.interceptStdErr().toFixed(3)}).`;

    // Store outputString in a text file if specified — skip in TS (no File I/O)
    if (this.outputPath.length > 1) {
      // Java writes to disk; in TS we log instead
      console.warn("SkillTrace: file output not implemented in TS port:", this.outputPath);
    }

    // Append output as an entry of the csv — skip in TS
    if (this.addToDatabaseFile) {
      let entryString = "";
      entryString += game.name() + ",";
      entryString += game.metadata().info().getId()[0] + ",";
      entryString += skillTrace + ",";
      entryString += this.numTrialsPerMatch + ",";
      entryString += matchCount + ",";
      entryString += this.hardTimeLimit + ",";
      entryString += linearRegression.slopeStdErr() + ",";
      entryString += linearRegression.interceptStdErr();
      console.warn("SkillTrace: DB file output not implemented in TS port:", entryString);
    }

    return skillTrace;
  }

  //-------------------------------------------------------------------------

  /** @java SkillTrace.setNumMatches(int) */
  public setNumMatches(numMatches: number): void {
    this.numMatches = numMatches;
  }

  /** @java SkillTrace.setNumTrialsPerMatch(int) */
  public setNumTrialsPerMatch(numTrialsPerMatch: number): void {
    this.numTrialsPerMatch = numTrialsPerMatch;
  }

  /** @java SkillTrace.setHardTimeLimit(int) */
  public setHardTimeLimit(hardTimeLimit: number): void {
    this.hardTimeLimit = hardTimeLimit;
  }

  /** @java SkillTrace.setOutputPath(String) */
  public setOutputPath(s: string): void {
    this.outputPath = s;
  }

  /** @java SkillTrace.setCombinedResultsOutputPath(String) */
  public setCombinedResultsOutputPath(combinedResultsOutputPath: string): void {
    this._combinedResultsOutputPath = combinedResultsOutputPath;
  }

  /** @java SkillTrace.setAddToDatabaseFile(boolean) */
  public setAddToDatabaseFile(addToDatabaseFile: boolean): void {
    this.addToDatabaseFile = addToDatabaseFile;
  }

  /** @java SkillTrace.combinedResultsOutputPath() */
  public combinedResultsOutputPath(): string {
    return this._combinedResultsOutputPath;
  }

  //-------------------------------------------------------------------------

  /** @java SkillTrace.startNewTrial(Context, Trial) */
  public override startNewTrial(_context: unknown, _fullTrial: unknown): void {
    console.error("Incrementally computing metric not yet implemented for SkillTrace.");
  }

  /** @java SkillTrace.observeNextState(Context) */
  public override observeNextState(_context: unknown): void {
    console.error("Incrementally computing metric not yet implemented for SkillTrace.");
  }

  /** @java SkillTrace.observeFinalState(Context) */
  public override observeFinalState(_context: unknown): void {
    console.error("Incrementally computing metric not yet implemented for SkillTrace.");
  }

  /** @java SkillTrace.finaliseMetric(Game, int) */
  public override finaliseMetric(_game: unknown, _numTrials: number): number {
    console.error("Incrementally computing metric not yet implemented for SkillTrace.");
    return NaN;
  }

  //-------------------------------------------------------------------------
}

// @java Evaluation/src/metrics/single/duration/DurationTurnsStdDev.java

/**
 * Number of turns in a game (std dev).
 *
 * @java metrics/single/duration/DurationTurnsStdDev.java
 * @author matthew.stephenson
 */

import { Metric } from "../../Metric.js";

/** @java main/Constants.INFINITY */
const CONSTANTS_INFINITY = 1000000000;

/** Minimal opaque type for not-yet-ported Game */
type Game = unknown;

/** Minimal opaque type for not-yet-ported Evaluation */
type Evaluation = unknown;

/** Minimal opaque type for not-yet-ported Trial */
type Trial = unknown;

/** Minimal opaque type for not-yet-ported RandomProviderState */
type RandomProviderState = unknown;

/** Minimal opaque type for not-yet-ported Context */
type Context = unknown;

/** Minimal opaque type for not-yet-ported Concept */
type Concept = unknown;

/** @java other/concept/Concept.DurationTurnsStdDev */
const ConceptDurationTurnsStdDev: Concept = "DurationTurnsStdDev" as unknown as Concept;

//-----------------------------------------------------------------------------

/**
 * Number of turns in a game (std dev).
 *
 * @java metrics/single/duration/DurationTurnsStdDev.java
 */
export class DurationTurnsStdDev extends Metric {

  //-------------------------------------------------------------------------

  /** @java DurationTurnsStdDev.turnTally — For incremental computation */
  protected turnTally: number[] = [];

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java DurationTurnsStdDev()
   */
  public constructor() {
    super(
      "Duration Turns Std Dev",
      "Number of turns in a game (std dev).",
      0.0,
      CONSTANTS_INFINITY,
      ConceptDurationTurnsStdDev,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java DurationTurnsStdDev.calculateSD(List<Integer>)
   */
  private static calculateSD(turnTally: number[]): number {
    let sum = 0.0;
    let standardDeviation = 0.0;
    const length = turnTally.length;

    for (const num of turnTally)
      sum += num;

    const mean = sum / length;

    for (const num of turnTally)
      standardDeviation += Math.pow(num - mean, 2);

    return Math.sqrt(standardDeviation / length);
  }

  //-------------------------------------------------------------------------

  /**
   * @java DurationTurnsStdDev.apply(Game, Evaluation, Trial[], RandomProviderState[])
   */
  public apply(
    _game: Game,
    _evaluation: Evaluation,
    trials: Trial[],
    _randomProviderStates: RandomProviderState[],
  ): number | null {
    const trialArr = trials as unknown as Array<{
      numTurns(): number;
    }>;

    // Count the number of turns.
    const turnTally: number[] = [];
    for (const trial of trialArr)
      turnTally.push(trial.numTurns());

    return DurationTurnsStdDev.calculateSD(turnTally);
  }

  //-------------------------------------------------------------------------

  /**
   * @java DurationTurnsStdDev.startNewTrial(Context, Trial)
   */
  public startNewTrial(_context: Context, _fullTrial: Trial): void {
    // Do nothing
  }

  /**
   * @java DurationTurnsStdDev.observeNextState(Context)
   */
  public observeNextState(_context: Context): void {
    // Do nothing
  }

  /**
   * @java DurationTurnsStdDev.observeFinalState(Context)
   */
  public observeFinalState(context: Context): void {
    const ctx = context as unknown as {
      trial(): { numTurns(): number };
    };
    this.turnTally.push(ctx.trial().numTurns());
  }

  /**
   * @java DurationTurnsStdDev.finaliseMetric(Game, int)
   */
  public finaliseMetric(_game: Game, _numTrials: number): number {
    return DurationTurnsStdDev.calculateSD(this.turnTally);
  }

  //-------------------------------------------------------------------------
}

// @java Evaluation/src/metrics/single/duration/DurationTurns.java

/**
 * Number of turns in a game.
 *
 * @java metrics/single/duration/DurationTurns.java
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

/** @java other/concept/Concept.DurationTurns */
const ConceptDurationTurns: Concept = "DurationTurns" as unknown as Concept;

//-----------------------------------------------------------------------------

/**
 * Number of turns in a game.
 *
 * @java metrics/single/duration/DurationTurns.java
 */
export class DurationTurns extends Metric {

  //-------------------------------------------------------------------------

  /** @java DurationTurns.turnTally — For incremental computation */
  protected turnTally: number = 0.0;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java DurationTurns()
   */
  public constructor() {
    super(
      "Duration Turns",
      "Number of turns in a game.",
      0.0,
      CONSTANTS_INFINITY,
      ConceptDurationTurns,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java DurationTurns.apply(Game, Evaluation, Trial[], RandomProviderState[])
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
    let turnTally = 0;
    for (const trial of trialArr)
      turnTally += trial.numTurns();

    return turnTally / trialArr.length;
  }

  //-------------------------------------------------------------------------

  /**
   * @java DurationTurns.startNewTrial(Context, Trial)
   */
  public startNewTrial(_context: Context, _fullTrial: Trial): void {
    // Do nothing
  }

  /**
   * @java DurationTurns.observeNextState(Context)
   */
  public observeNextState(_context: Context): void {
    // Do nothing
  }

  /**
   * @java DurationTurns.observeFinalState(Context)
   */
  public observeFinalState(context: Context): void {
    const ctx = context as unknown as {
      trial(): { numTurns(): number };
    };
    this.turnTally += ctx.trial().numTurns();
  }

  /**
   * @java DurationTurns.finaliseMetric(Game, int)
   */
  public finaliseMetric(_game: Game, numTrials: number): number {
    return this.turnTally / numTrials;
  }

  //-------------------------------------------------------------------------
}

// @java Evaluation/src/metrics/single/duration/DurationMoves.java

/**
 * Number of moves in a game.
 *
 * @java metrics/single/duration/DurationMoves.java
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

/** @java other/concept/Concept.DurationMoves */
const ConceptDurationMoves: Concept = "DurationMoves" as unknown as Concept;

//-----------------------------------------------------------------------------

/**
 * Number of moves in a game.
 *
 * @java metrics/single/duration/DurationMoves.java
 */
export class DurationMoves extends Metric {

  //-------------------------------------------------------------------------

  /** @java DurationMoves.moveTally — For incremental computation */
  moveTally: number = 0.0;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java DurationMoves()
   */
  public constructor() {
    super(
      "Duration Moves",
      "Number of moves in a game.",
      0.0,
      CONSTANTS_INFINITY,
      ConceptDurationMoves,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java DurationMoves.apply(Game, Evaluation, Trial[], RandomProviderState[])
   */
  public apply(
    _game: Game,
    _evaluation: Evaluation,
    trials: Trial[],
    _randomProviderStates: RandomProviderState[],
  ): number | null {
    const trialArr = trials as unknown as Array<{
      numberRealMoves(): number;
    }>;

    // Count the number of moves.
    let moveTally = 0;
    for (const trial of trialArr)
      moveTally += trial.numberRealMoves();

    return moveTally / trialArr.length;
  }

  //-------------------------------------------------------------------------

  /**
   * @java DurationMoves.startNewTrial(Context, Trial)
   */
  public startNewTrial(_context: Context, _fullTrial: Trial): void {
    // Do nothing
  }

  /**
   * @java DurationMoves.observeNextState(Context)
   */
  public observeNextState(_context: Context): void {
    // Do nothing
  }

  /**
   * @java DurationMoves.observeFinalState(Context)
   */
  public observeFinalState(context: Context): void {
    const ctx = context as unknown as {
      trial(): { numberRealMoves(): number };
    };
    this.moveTally += ctx.trial().numberRealMoves();
  }

  /**
   * @java DurationMoves.finaliseMetric(Game, int)
   */
  public finaliseMetric(_game: Game, numTrials: number): number {
    return this.moveTally / numTrials;
  }

  //-------------------------------------------------------------------------
}

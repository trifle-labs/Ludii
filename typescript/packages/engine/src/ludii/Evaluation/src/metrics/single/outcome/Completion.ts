// @java Evaluation/src/metrics/single/outcome/Completion.java

/**
 * Percentage of games which have a winner (not draw or timeout).
 *
 * @java metrics/single/outcome/Completion.java
 * @author cambolbro and matthew.stephenson
 */

import { Metric } from "../../Metric.js";

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

/** @java other/concept/Concept.Completion */
const ConceptCompletion: Concept = "Completion" as unknown as Concept;

//-----------------------------------------------------------------------------

/**
 * Percentage of games which have a winner (not draw or timeout).
 *
 * @java metrics/single/outcome/Completion.java
 */
export class Completion extends Metric {

  //-------------------------------------------------------------------------

  /** For incremental computation. @java Completion.completedGames */
  protected completedGames: number = 0.0;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java Completion()
   */
  public constructor() {
    super(
      "Completion",
      "Percentage of games which have a winner (not draw or timeout).",
      0.0,
      1.0,
      ConceptCompletion,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java Completion.apply(Game, Evaluation, Trial[], RandomProviderState[])
   */
  public apply(
    _game: Game,
    _evaluation: Evaluation,
    trials: Trial[],
    _randomProviderStates: RandomProviderState[],
  ): number | null {
    // Count number of completed games
    let completedGames = 0.0;
    for (let i = 0; i < trials.length; i++) {
      const trial = trials[i] as unknown as {
        status(): { winner(): number } | null;
      };

      if (trial.status() !== null && trial.status()!.winner() !== 0)
        completedGames++;
    }

    return completedGames / trials.length;
  }

  //-------------------------------------------------------------------------

  /**
   * @java Completion.startNewTrial(Context, Trial)
   */
  public startNewTrial(_context: Context, _fullTrial: Trial): void {
    // Do nothing
  }

  /**
   * @java Completion.observeNextState(Context)
   */
  public observeNextState(_context: Context): void {
    // Do nothing
  }

  /**
   * @java Completion.observeFinalState(Context)
   */
  public observeFinalState(context: Context): void {
    const ctx = context as unknown as {
      trial(): {
        status(): { winner(): number } | null;
      };
    };
    if (ctx.trial().status() !== null && ctx.trial().status()!.winner() !== 0)
      this.completedGames++;
  }

  /**
   * @java Completion.finaliseMetric(Game, int)
   */
  public finaliseMetric(_game: Game, numTrials: number): number {
    return this.completedGames / numTrials;
  }

  //-------------------------------------------------------------------------
}

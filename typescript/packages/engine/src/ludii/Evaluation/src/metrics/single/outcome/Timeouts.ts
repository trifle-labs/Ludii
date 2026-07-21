// @java Evaluation/src/metrics/single/outcome/Timeouts.java

/**
 * Percentage of games which end via timeout.
 *
 * @java metrics/single/outcome/Timeouts.java
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

/** @java other/concept/Concept.Timeouts */
const ConceptTimeouts: Concept = "Timeouts" as unknown as Concept;

/** @java main/Status.EndType */
type EndType = unknown;
const EndTypeMoveLimit = "MoveLimit";
const EndTypeTurnLimit = "TurnLimit";

//-----------------------------------------------------------------------------

/**
 * Percentage of games which end via timeout.
 *
 * @java metrics/single/outcome/Timeouts.java
 */
export class Timeouts extends Metric {

  //-------------------------------------------------------------------------

  /** @java Timeouts.timeouts — For incremental computation */
  protected timeouts: number = 0.0;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java Timeouts()
   */
  public constructor() {
    super(
      "Timeouts",
      "Percentage of games which end via timeout.",
      0.0,
      1.0,
      ConceptTimeouts,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java Timeouts.apply(Game, Evaluation, Trial[], RandomProviderState[])
   */
  public apply(
    _game: Game,
    _evaluation: Evaluation,
    trials: Trial[],
    _randomProviderStates: RandomProviderState[],
  ): number | null {
    // Count number of timeouts.
    let timeouts = 0.0;
    const trialArr = trials as unknown as Array<{
      status(): { endType(): string } | null;
    }>;
    for (let i = 0; i < trialArr.length; i++) {
      const trial = trialArr[i]!;
      const status = trial.status();
      // Trial ended by timeout.
      const trialTimedOut =
        status !== null &&
        (status.endType() === EndTypeMoveLimit || status.endType() === EndTypeTurnLimit);
      if (trialTimedOut)
        timeouts++;
    }
    return timeouts / trialArr.length;
  }

  //-------------------------------------------------------------------------

  /**
   * @java Timeouts.startNewTrial(Context, Trial)
   */
  public startNewTrial(_context: Context, _fullTrial: Trial): void {
    // Do nothing
  }

  /**
   * @java Timeouts.observeNextState(Context)
   */
  public observeNextState(_context: Context): void {
    // Do nothing
  }

  /**
   * @java Timeouts.observeFinalState(Context)
   */
  public observeFinalState(context: Context): void {
    const ctx = context as unknown as {
      trial(): {
        status(): { endType(): string } | null;
      };
    };
    const trial = ctx.trial();
    const status = trial.status();
    const trialTimedOut =
      status === null ||
      status.endType() === EndTypeMoveLimit ||
      status.endType() === EndTypeTurnLimit;
    if (trialTimedOut)
      this.timeouts++;
  }

  /**
   * @java Timeouts.finaliseMetric(Game, int)
   */
  public finaliseMetric(_game: Game, numTrials: number): number {
    return this.timeouts / numTrials;
  }

  //-------------------------------------------------------------------------
}

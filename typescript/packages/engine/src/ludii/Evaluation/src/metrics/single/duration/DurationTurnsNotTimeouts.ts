// @java Evaluation/src/metrics/single/duration/DurationTurnsNotTimeouts.java

/**
 * Number of turns in a game (excluding timeouts).
 *
 * @java metrics/single/duration/DurationTurnsNotTimeouts.java
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

/** @java other/concept/Concept.DurationTurnsNotTimeouts */
const ConceptDurationTurnsNotTimeouts: Concept = "DurationTurnsNotTimeouts" as unknown as Concept;

/** @java main/Status.EndType string values */
const EndTypeMoveLimit = "MoveLimit";
const EndTypeTurnLimit = "TurnLimit";

//-----------------------------------------------------------------------------

/**
 * Number of turns in a game (excluding timeouts).
 *
 * @java metrics/single/duration/DurationTurnsNotTimeouts.java
 */
export class DurationTurnsNotTimeouts extends Metric {

  //-------------------------------------------------------------------------

  /** @java DurationTurnsNotTimeouts.turnTally — For incremental computation */
  protected turnTally: number = 0.0;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java DurationTurnsNotTimeouts()
   */
  public constructor() {
    super(
      "Duration Turns Not Timeouts",
      "Number of turns in a game (excluding timeouts).",
      0.0,
      CONSTANTS_INFINITY,
      ConceptDurationTurnsNotTimeouts,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java DurationTurnsNotTimeouts.apply(Game, Evaluation, Trial[], RandomProviderState[])
   */
  public apply(
    game: Game,
    _evaluation: Evaluation,
    trials: Trial[],
    _randomProviderStates: RandomProviderState[],
  ): number | null {
    const g = game as unknown as {
      players(): { count(): number };
      getMaxTurnLimit(): number;
    };
    const trialArr = trials as unknown as Array<{
      status(): { endType(): string } | null;
      numTurns(): number;
    }>;

    // Count the number of turns.
    let turnTally = 0;
    let numTrials = 0;
    for (const trial of trialArr) {
      const status = trial.status();
      const trialTimedOut =
        status !== null &&
        (status.endType() === EndTypeMoveLimit || status.endType() === EndTypeTurnLimit);
      if (!trialTimedOut) {
        turnTally += trial.numTurns();
        numTrials++;
      }
    }

    // Check if all trials timed out
    if (numTrials === 0) {
      if (g.players().count() <= 1)
        return 1;
      else
        return g.getMaxTurnLimit() * g.players().count();
    }

    return turnTally / numTrials;
  }

  //-------------------------------------------------------------------------

  /**
   * @java DurationTurnsNotTimeouts.startNewTrial(Context, Trial)
   */
  public startNewTrial(_context: Context, _fullTrial: Trial): void {
    // Do nothing
  }

  /**
   * @java DurationTurnsNotTimeouts.observeNextState(Context)
   */
  public observeNextState(_context: Context): void {
    // Do nothing
  }

  /**
   * @java DurationTurnsNotTimeouts.observeFinalState(Context)
   */
  public observeFinalState(context: Context): void {
    const ctx = context as unknown as {
      trial(): {
        status(): { endType(): string } | null;
        numTurns(): number;
      };
    };
    const status = ctx.trial().status();
    if (status !== null) {
      const trialTimedOut =
        status.endType() === EndTypeMoveLimit ||
        status.endType() === EndTypeTurnLimit;
      if (!trialTimedOut) {
        this.turnTally += ctx.trial().numTurns();
      }
    }
  }

  /**
   * @java DurationTurnsNotTimeouts.finaliseMetric(Game, int)
   */
  public finaliseMetric(_game: Game, numTrials: number): number {
    return this.turnTally / numTrials;
  }

  //-------------------------------------------------------------------------
}

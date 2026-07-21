// @java Evaluation/src/metrics/single/duration/DurationActions.java

/**
 * Number of actions in a game.
 *
 * @java metrics/single/duration/DurationActions.java
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

/** @java other/concept/Concept.DurationActions */
const ConceptDurationActions: Concept = "DurationActions" as unknown as Concept;

//-----------------------------------------------------------------------------

/**
 * Number of actions in a game.
 *
 * @java metrics/single/duration/DurationActions.java
 */
export class DurationActions extends Metric {

  //-------------------------------------------------------------------------

  /** @java DurationActions.actionTally — For incremental computation */
  protected actionTally: number = 0.0;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java DurationActions()
   */
  public constructor() {
    super(
      "Duration Actions",
      "Number of actions in a game.",
      0.0,
      CONSTANTS_INFINITY,
      ConceptDurationActions,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java DurationActions.apply(Game, Evaluation, Trial[], RandomProviderState[])
   */
  public apply(
    _game: Game,
    _evaluation: Evaluation,
    trials: Trial[],
    _randomProviderStates: RandomProviderState[],
  ): number | null {
    const trialArr = trials as unknown as Array<{
      generateRealMovesList(): Array<{ actions(): { size(): number } | unknown[] }>;
    }>;

    // Count the number of actions.
    let actionTally = 0;
    for (const trial of trialArr) {
      for (const m of trial.generateRealMovesList()) {
        const acts = m.actions();
        // Support both Java-style .size() and TS-style .length
        if (typeof (acts as { size?: () => number }).size === "function")
          actionTally += (acts as { size(): number }).size();
        else
          actionTally += (acts as unknown[]).length;
      }
    }

    return actionTally / trialArr.length;
  }

  //-------------------------------------------------------------------------

  /**
   * @java DurationActions.startNewTrial(Context, Trial)
   */
  public startNewTrial(_context: Context, _fullTrial: Trial): void {
    // Do nothing
  }

  /**
   * @java DurationActions.observeNextState(Context)
   */
  public observeNextState(context: Context): void {
    const ctx = context as unknown as {
      trial(): {
        lastMove(): { actions(): { size(): number } | unknown[] };
      };
    };
    const acts = ctx.trial().lastMove().actions();
    if (typeof (acts as { size?: () => number }).size === "function")
      this.actionTally += (acts as { size(): number }).size();
    else
      this.actionTally += (acts as unknown[]).length;
  }

  /**
   * @java DurationActions.observeFinalState(Context)
   */
  public observeFinalState(_context: Context): void {
    // Do nothing
  }

  /**
   * @java DurationActions.finaliseMetric(Game, int)
   */
  public finaliseMetric(_game: Game, numTrials: number): number {
    return this.actionTally / numTrials;
  }

  //-------------------------------------------------------------------------
}

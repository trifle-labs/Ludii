// @java Evaluation/src/metrics/single/stateRepetition/PositionalRepetition.java

/**
 * Percentage number of repeated positional states.
 *
 * @java metrics/single/stateRepetition/PositionalRepetition.java
 * @author matthew.stephenson
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

/** Minimal opaque type for not-yet-ported Move */
type Move = unknown;

/** @java other/concept/Concept.PositionalRepetition */
const ConceptPositionalRepetition: Concept = "PositionalRepetition" as unknown as Concept;

//-----------------------------------------------------------------------------
// Escape-hatch stub for metrics.Utils (not yet ported)
//-----------------------------------------------------------------------------

function utils_setupNewContext(_game: Game, _rngState: RandomProviderState): Context {
  return null as unknown as Context;
}

//-----------------------------------------------------------------------------

/**
 * Percentage number of repeated positional states.
 *
 * @java metrics/single/stateRepetition/PositionalRepetition.java
 */
export class PositionalRepetition extends Metric {

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java PositionalRepetition()
   */
  public constructor() {
    super(
      "Positional Repetition",
      "Percentage number of repeated positional states.",
      0.0,
      1.0,
      ConceptPositionalRepetition,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java PositionalRepetition.apply(Game, Evaluation, Trial[], RandomProviderState[])
   */
  public apply(
    game: Game,
    _evaluation: Evaluation,
    trials: Trial[],
    randomProviderStates: RandomProviderState[],
  ): number | null {
    const g = game as unknown as {
      apply(ctx: Context, m: Move): void;
    };

    let avgStateRepeats = 0;
    for (let trialIndex = 0; trialIndex < trials.length; trialIndex++) {
      // Get trial and RNG information
      const trial = trials[trialIndex] as unknown as {
        generateRealMovesList(): Move[];
      };
      const rngState = randomProviderStates[trialIndex];

      // Setup a new instance of the game
      const context: Context = utils_setupNewContext(game, rngState);

      const ctx = context as unknown as {
        state(): {
          stateHash(): bigint;
        };
      };

      // Record the number of possible options for each move.
      // TLongArrayList → bigint[]
      const trialStates: bigint[] = [];
      // TIntArrayList → number[]
      const trialStateCounts: number[] = [];

      // Record the initial state.
      trialStates.push(ctx.state().stateHash());
      trialStateCounts.push(1);

      for (const m of trial.generateRealMovesList()) {
        g.apply(context, m);

        const currentState: bigint = ctx.state().stateHash();
        const currentStateIndex: number = trialStates.indexOf(currentState);

        if (currentStateIndex !== -1) {
          // If state was seen before
          trialStateCounts[currentStateIndex] = trialStateCounts[currentStateIndex]! + 1;
        } else {
          // If state is new
          trialStates.push(currentState);
          trialStateCounts.push(1);
        }
      }

      const numUniqueStates: number = trialStates.length;
      const numTotalStates: number = trialStateCounts.reduce((a, b) => a + b, 0);
      avgStateRepeats += 1.0 - (numUniqueStates / numTotalStates);
    }

    return avgStateRepeats / trials.length;
  }

  //-------------------------------------------------------------------------

  /**
   * @java PositionalRepetition.startNewTrial(Context, Trial)
   */
  public startNewTrial(_context: Context, _fullTrial: Trial): void {
    console.error("Incrementally computing metric not yet implemented for PositionalRepetition.");
  }

  /**
   * @java PositionalRepetition.observeNextState(Context)
   */
  public observeNextState(_context: Context): void {
    console.error("Incrementally computing metric not yet implemented for PositionalRepetition.");
  }

  /**
   * @java PositionalRepetition.observeFinalState(Context)
   */
  public observeFinalState(_context: Context): void {
    console.error("Incrementally computing metric not yet implemented for PositionalRepetition.");
  }

  /**
   * @java PositionalRepetition.finaliseMetric(Game, int)
   */
  public finaliseMetric(_game: Game, _numTrials: number): number {
    console.error("Incrementally computing metric not yet implemented for PositionalRepetition.");
    return NaN;
  }

  //-------------------------------------------------------------------------
}

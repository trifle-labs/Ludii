// @java Evaluation/src/metrics/single/stateEvaluation/decisiveness/DecisivenessThreshold.java

/**
 * Maximum state evaluation value achieved by non-winning player.
 *
 * @java metrics/single/stateEvaluation/decisiveness/DecisivenessThreshold.java
 * @author matthew.stephenson
 */

import { Metric } from "../../../Metric.js";

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

/** @java other/concept/Concept.DecisivenessThreshold */
const ConceptDecisivenessThreshold: Concept = "DecisivenessThreshold" as unknown as Concept;

//-----------------------------------------------------------------------------

/** @java metrics/Utils — escape hatch */
type UtilsLike = {
  setupNewContext(game: Game, rngState: RandomProviderState): Context;
  allPlayerStateEvaluations(evaluation: Evaluation, context: Context): number[];
  highestRankedPlayers(trial: Trial, context: Context): number[];
};

//-----------------------------------------------------------------------------

/**
 * Maximum state evaluation value achieved by non-winning player.
 *
 * @java metrics/single/stateEvaluation/decisiveness/DecisivenessThreshold.java
 */
export class DecisivenessThreshold extends Metric {

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java DecisivenessThreshold()
   */
  public constructor() {
    super(
      "Decisiveness Threshold",
      "Maximum state evaluation value achieved by non-winning player.",
      0.0,
      1.0,
      ConceptDecisivenessThreshold,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java DecisivenessThreshold.apply(Game, Evaluation, Trial[], RandomProviderState[])
   */
  public apply(
    game: Game,
    evaluation: Evaluation,
    trials: Trial[],
    randomProviderStates: RandomProviderState[],
  ): number | null {
    const g = game as unknown as {
      hasSubgames(): boolean;
      isSimultaneousMoveGame(): boolean;
    };

    // Cannot perform move/state evaluation for matches.
    if (g.hasSubgames() || g.isSimultaneousMoveGame())
      return null;

    let avgDecisivenessThreshold = 0.0;
    const trialArr = trials as unknown as Trial[];
    const rngArr = randomProviderStates as unknown as RandomProviderState[];

    for (let trialIndex = 0; trialIndex < trialArr.length; trialIndex++) {
      // Get trial and RNG information
      const trial = trialArr[trialIndex]!;
      const rngState = rngArr[trialIndex]!;

      const dt = DecisivenessThreshold.decisivenessThreshold(game, evaluation, trial, rngState);
      avgDecisivenessThreshold += dt;
    }

    return avgDecisivenessThreshold / trialArr.length;
  }

  //-------------------------------------------------------------------------

  /**
   * @java DecisivenessThreshold.decisivenessThreshold(Game, Evaluation, Trial, RandomProviderState)
   */
  public static decisivenessThreshold(
    game: Game,
    evaluation: Evaluation,
    trial: Trial,
    rngState: RandomProviderState,
  ): number {
    const g = game as unknown as {
      apply(context: Context, move: unknown): void;
    };

    // Import Utils via escape hatch
    const Utils = {} as unknown as UtilsLike;

    // Setup a new instance of the game
    const context = Utils.setupNewContext(game, rngState);

    let decisivenessThreshold = -1.0;

    const highestRankedPlayers = Utils.highestRankedPlayers(trial, context);

    const trialTyped = trial as unknown as {
      generateRealMovesList(): unknown[];
    };

    for (const m of trialTyped.generateRealMovesList()) {
      const allPlayerStateEvaluations = Utils.allPlayerStateEvaluations(evaluation, context);
      for (let j = 1; j < allPlayerStateEvaluations.length; j++) {
        if (
          (allPlayerStateEvaluations[j] as number) > decisivenessThreshold &&
          !highestRankedPlayers.includes(j)
        )
          decisivenessThreshold = allPlayerStateEvaluations[j] as number;
      }
      g.apply(context, m);
    }

    return decisivenessThreshold;
  }

  //-------------------------------------------------------------------------

  /**
   * @java DecisivenessThreshold.startNewTrial(Context, Trial)
   */
  public startNewTrial(_context: Context, _fullTrial: Trial): void {
    console.error("Incrementally computing metric not yet implemented for DecisivenessThreshold.");
  }

  /**
   * @java DecisivenessThreshold.observeNextState(Context)
   */
  public observeNextState(_context: Context): void {
    console.error("Incrementally computing metric not yet implemented for DecisivenessThreshold.");
  }

  /**
   * @java DecisivenessThreshold.observeFinalState(Context)
   */
  public observeFinalState(_context: Context): void {
    console.error("Incrementally computing metric not yet implemented for DecisivenessThreshold.");
  }

  /**
   * @java DecisivenessThreshold.finaliseMetric(Game, int)
   */
  public finaliseMetric(_game: Game, _numTrials: number): number {
    console.error("Incrementally computing metric not yet implemented for DecisivenessThreshold.");
    return NaN;
  }

  //-------------------------------------------------------------------------
}

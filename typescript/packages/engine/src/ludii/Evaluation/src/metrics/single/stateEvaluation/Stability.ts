// @java Evaluation/src/metrics/single/stateEvaluation/Stability.java

/**
 * Average variance in each player's state evaluation.
 *
 * @java metrics/single/stateEvaluation/Stability.java
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

/** @java other/concept/Concept.Stability */
const ConceptStability: Concept = "Stability" as unknown as Concept;

//-----------------------------------------------------------------------------

/** @java metrics/Utils — escape hatch */
type UtilsLike = {
  setupNewContext(game: Game, rngState: RandomProviderState): Context;
  allPlayerStateEvaluations(evaluation: Evaluation, context: Context): number[];
};

//-----------------------------------------------------------------------------

/**
 * Average variance in each player's state evaluation.
 *
 * @java metrics/single/stateEvaluation/Stability.java
 */
export class Stability extends Metric {

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java Stability()
   */
  public constructor() {
    super(
      "Stability",
      "Average variance in each player's state evaluation.",
      0.0,
      1.0,
      ConceptStability,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java Stability.apply(Game, Evaluation, Trial[], RandomProviderState[])
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
      players(): { count(): number };
      apply(context: Context, move: unknown): void;
    };

    // Cannot perform move/state evaluation for matches.
    if (g.hasSubgames() || g.isSimultaneousMoveGame())
      return null;

    // Import Utils via escape hatch
    const Utils = {} as unknown as UtilsLike;

    let avgStability = 0.0;
    const trialArr = trials as unknown as Array<{
      generateRealMovesList(): unknown[];
      numInitialPlacementMoves(): number;
      numMoves(): number;
    }>;
    const rngArr = randomProviderStates as unknown as RandomProviderState[];

    for (let trialIndex = 0; trialIndex < trialArr.length; trialIndex++) {
      // Get trial and RNG information
      const trial = trialArr[trialIndex]!;
      const rngState = rngArr[trialIndex]!;

      // Setup a new instance of the game
      const context = Utils.setupNewContext(game, rngState);

      const ctxGame = context as unknown as { game(): typeof g };

      // Get the state evaluations for each player across the whole trial.
      const allPlayersStateEvaluationsAcrossTrial: number[][] = [];
      for (let i = 0; i <= ctxGame.game().players().count(); i++)
        allPlayersStateEvaluationsAcrossTrial.push([]);

      const realMoves = trial.generateRealMovesList();

      for (let i = trial.numInitialPlacementMoves(); i < trial.numMoves(); i++) {
        const allPlayerStateEvaluations = Utils.allPlayerStateEvaluations(evaluation, context);
        for (let j = 1; j < allPlayerStateEvaluations.length; j++) {
          (allPlayersStateEvaluationsAcrossTrial[j] as number[]).push(allPlayerStateEvaluations[j] as number);
        }
        ctxGame.game().apply(context, realMoves[i - trial.numInitialPlacementMoves()]!);
      }

      // Record the average variance for each players state evaluations.
      let stateEvaluationVariance = 0.0;
      for (const valueList of allPlayersStateEvaluationsAcrossTrial) {
        let metricAverage = 0.0;
        for (const value of valueList)
          metricAverage += value / valueList.length;

        let metricVariance = 0.0;
        for (const value of valueList)
          metricVariance += Math.pow(value - metricAverage, 2) / valueList.length;

        stateEvaluationVariance += metricVariance;
      }

      avgStability += stateEvaluationVariance;
    }

    return avgStability / trialArr.length;
  }

  //-------------------------------------------------------------------------

  /**
   * @java Stability.startNewTrial(Context, Trial)
   */
  public startNewTrial(_context: Context, _fullTrial: Trial): void {
    console.error("Incrementally computing metric not yet implemented for Stability.");
  }

  /**
   * @java Stability.observeNextState(Context)
   */
  public observeNextState(_context: Context): void {
    console.error("Incrementally computing metric not yet implemented for Stability.");
  }

  /**
   * @java Stability.observeFinalState(Context)
   */
  public observeFinalState(_context: Context): void {
    console.error("Incrementally computing metric not yet implemented for Stability.");
  }

  /**
   * @java Stability.finaliseMetric(Game, int)
   */
  public finaliseMetric(_game: Game, _numTrials: number): number {
    console.error("Incrementally computing metric not yet implemented for Stability.");
    return NaN;
  }

  //-------------------------------------------------------------------------
}

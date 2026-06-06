// @java Evaluation/src/metrics/single/stateEvaluation/clarity/ClarityVariance.java

/**
 * The average variance in the evaluation values for the legal moves.
 *
 * @java metrics/single/stateEvaluation/clarity/ClarityVariance.java
 * @author matthew.stephenson
 */

import { Metric } from "../../../Metric.js";
import { Stats } from "../../../../../../Common/src/main/math/statistics/Stats.js";

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

/** @java other/concept/Concept.Variance */
const ConceptVariance: Concept = "Variance" as unknown as Concept;

//-----------------------------------------------------------------------------

/** @java metrics/Utils — escape hatch */
type UtilsLike = {
  setupNewContext(game: Game, rngState: RandomProviderState): Context;
  evaluateMove(evaluation: Evaluation, context: Context, move: unknown): number;
};

//-----------------------------------------------------------------------------

/**
 * The average variance in the evaluation values for the legal moves.
 *
 * @java metrics/single/stateEvaluation/clarity/ClarityVariance.java
 */
export class ClarityVariance extends Metric {

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java ClarityVariance()
   */
  public constructor() {
    super(
      "Clarity Variance",
      "The average variance in the evaluation values for the legal moves.",
      0.0,
      1.0,
      ConceptVariance,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java ClarityVariance.apply(Game, Evaluation, Trial[], RandomProviderState[])
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
      moves(context: Context): { moves(): unknown[] };
      apply(context: Context, move: unknown): void;
    };

    // Cannot perform move/state evaluation for matches.
    if (g.hasSubgames() || g.isSimultaneousMoveGame())
      return null;

    // Import Utils via escape hatch
    const Utils = {} as unknown as UtilsLike;

    let clarity = 0;
    const trialArr = trials as unknown as Array<{
      generateRealMovesList(): unknown[];
    }>;
    const rngArr = randomProviderStates as unknown as RandomProviderState[];

    for (let trialIndex = 0; trialIndex < trialArr.length; trialIndex++) {
      // Get trial and RNG information
      const trial = trialArr[trialIndex]!;
      const rngState = rngArr[trialIndex]!;

      // Setup a new instance of the game
      const context = Utils.setupNewContext(game, rngState);

      // Record all sites covered in this trial.
      const moveEvaluationVariance = new Stats();

      const ctxGame = context as unknown as { game(): typeof g };

      for (const m of trial.generateRealMovesList()) {
        const moveEvaluations = new Stats();
        for (const legalMoves of ctxGame.game().moves(context).moves())
          moveEvaluations.addSample(Utils.evaluateMove(evaluation, context, legalMoves));

        moveEvaluations.measure();

        moveEvaluationVariance.addSample(moveEvaluations.varnValue());
        ctxGame.game().apply(context, m);
      }

      moveEvaluationVariance.measure();
      clarity += moveEvaluationVariance.getMean();
    }

    return clarity / trialArr.length;
  }

  //-------------------------------------------------------------------------

  /**
   * @java ClarityVariance.startNewTrial(Context, Trial)
   */
  public startNewTrial(_context: Context, _fullTrial: Trial): void {
    console.error("Incrementally computing metric not yet implemented for ClarityVariance.");
  }

  /**
   * @java ClarityVariance.observeNextState(Context)
   */
  public observeNextState(_context: Context): void {
    console.error("Incrementally computing metric not yet implemented for ClarityVariance.");
  }

  /**
   * @java ClarityVariance.observeFinalState(Context)
   */
  public observeFinalState(_context: Context): void {
    console.error("Incrementally computing metric not yet implemented for ClarityVariance.");
  }

  /**
   * @java ClarityVariance.finaliseMetric(Game, int)
   */
  public finaliseMetric(_game: Game, _numTrials: number): number {
    console.error("Incrementally computing metric not yet implemented for ClarityVariance.");
    return NaN;
  }

  //-------------------------------------------------------------------------
}

// @java Evaluation/src/metrics/single/stateEvaluation/clarity/ClarityNarrowness.java

/**
 * The percentage of legal moves that have an evaluation value at least 75%
 * above the difference between the max move evaluation value and average move
 * evaluation value.
 *
 * @java metrics/single/stateEvaluation/clarity/ClarityNarrowness.java
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

/** @java other/concept/Concept.Narrowness */
const ConceptNarrowness: Concept = "Narrowness" as unknown as Concept;

//-----------------------------------------------------------------------------

/** @java metrics/Utils — escape hatch */
type UtilsLike = {
  setupNewContext(game: Game, rngState: RandomProviderState): Context;
  evaluateMove(evaluation: Evaluation, context: Context, move: unknown): number;
};

//-----------------------------------------------------------------------------

/**
 * The percentage of legal moves that have an evaluation value at least 75%
 * above the difference between the max move evaluation value and average move
 * evaluation value.
 *
 * @java metrics/single/stateEvaluation/clarity/ClarityNarrowness.java
 */
export class ClarityNarrowness extends Metric {

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java ClarityNarrowness()
   */
  public constructor() {
    super(
      "Clarity Narrowness",
      "The percentage of legal moves that have an evaluation value at least 75% above the difference between the max move evaluation value and average move evaluation value.",
      0.0,
      1.0,
      ConceptNarrowness,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java ClarityNarrowness.apply(Game, Evaluation, Trial[], RandomProviderState[])
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
      const moveNarrowness = new Stats();

      const ctxGame = context as unknown as { game(): typeof g };

      for (const m of trial.generateRealMovesList()) {
        const moveEvaluations = new Stats();
        for (const legalMoves of ctxGame.game().moves(context).moves())
          moveEvaluations.addSample(Utils.evaluateMove(evaluation, context, legalMoves));

        moveEvaluations.measure();

        const maxEvaluation = moveEvaluations.getMax();
        const averageEvaluation = moveEvaluations.getMean();
        const threshold = averageEvaluation + 0.75 * (maxEvaluation - averageEvaluation);

        let numberAboveThreshold = 0;
        for (let j = 0; j < moveEvaluations.n(); j++) {
          if (moveEvaluations.get(j) > threshold)
            numberAboveThreshold++;
        }

        moveNarrowness.addSample(moveEvaluations.n() === 0 ? 0 : numberAboveThreshold / moveEvaluations.n());

        ctxGame.game().apply(context, m);
      }

      moveNarrowness.measure();
      clarity += moveNarrowness.getMean();
    }

    return trialArr.length === 0 ? 0 : clarity / trialArr.length;
  }

  //-------------------------------------------------------------------------

  /**
   * @java ClarityNarrowness.startNewTrial(Context, Trial)
   */
  public startNewTrial(_context: Context, _fullTrial: Trial): void {
    console.error("Incrementally computing metric not yet implemented for ClarityNarrowness.");
  }

  /**
   * @java ClarityNarrowness.observeNextState(Context)
   */
  public observeNextState(_context: Context): void {
    console.error("Incrementally computing metric not yet implemented for ClarityNarrowness.");
  }

  /**
   * @java ClarityNarrowness.observeFinalState(Context)
   */
  public observeFinalState(_context: Context): void {
    console.error("Incrementally computing metric not yet implemented for ClarityNarrowness.");
  }

  /**
   * @java ClarityNarrowness.finaliseMetric(Game, int)
   */
  public finaliseMetric(_game: Game, _numTrials: number): number {
    console.error("Incrementally computing metric not yet implemented for ClarityNarrowness.");
    return NaN;
  }

  //-------------------------------------------------------------------------
}

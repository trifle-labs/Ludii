// @java Evaluation/src/metrics/single/stateEvaluation/LeadChange.java

/**
 * Percentage number of times the expected winner changes.
 *
 * @java metrics/single/stateEvaluation/LeadChange.java
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

/** @java other/concept/Concept.LeadChange */
const ConceptLeadChange: Concept = "LeadChange" as unknown as Concept;

//-----------------------------------------------------------------------------

/** @java metrics/Utils.setupNewContext — escape hatch */
type UtilsLike = {
  setupNewContext(game: Game, rngState: RandomProviderState): Context;
  allPlayerStateEvaluations(evaluation: Evaluation, context: Context): number[];
};

//-----------------------------------------------------------------------------

/**
 * Percentage number of times the expected winner changes.
 *
 * @java metrics/single/stateEvaluation/LeadChange.java
 */
export class LeadChange extends Metric {

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java LeadChange()
   */
  public constructor() {
    super(
      "Lead Change",
      "Percentage number of times the expected winner changes.",
      0.0,
      1.0,
      ConceptLeadChange,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java LeadChange.apply(Game, Evaluation, Trial[], RandomProviderState[])
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
      apply(context: Context, move: unknown): void;
    };

    // Cannot perform move/state evaluation for matches.
    if (g.hasSubgames() || g.isSimultaneousMoveGame())
      return null;

    // Import Utils via escape hatch
    const Utils = {} as unknown as UtilsLike;

    let avgLeadChange = 0.0;
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

      // Count number of times the expected winner changed.
      let leadChange = 0;

      const pastCurrentLeaders = new Set<number>();

      for (const m of trial.generateRealMovesList()) {
        const currentLeaders = new Set<number>();
        const allPlayerStateEvaluations = Utils.allPlayerStateEvaluations(evaluation, context);
        let highestStateEvaluation = -Infinity;
        for (let j = 1; j < allPlayerStateEvaluations.length; j++) {
          if ((allPlayerStateEvaluations[j] as number) > highestStateEvaluation)
            highestStateEvaluation = allPlayerStateEvaluations[j] as number;
        }
        for (let j = 1; j < allPlayerStateEvaluations.length; j++) {
          if ((allPlayerStateEvaluations[j] as number) === highestStateEvaluation)
            currentLeaders.add(j);
        }

        // Check if sets are equal
        let setsEqual =
          pastCurrentLeaders.size === currentLeaders.size;
        if (setsEqual) {
          for (const val of pastCurrentLeaders) {
            if (!currentLeaders.has(val)) { setsEqual = false; break; }
          }
        }
        if (!setsEqual)
          leadChange++;

        // Update pastCurrentLeaders
        pastCurrentLeaders.clear();
        for (const val of currentLeaders) pastCurrentLeaders.add(val);

        g.apply(context, m);
      }

      const realMoves = trial.generateRealMovesList();
      avgLeadChange += leadChange / realMoves.length;
    }

    return avgLeadChange / trialArr.length;
  }

  //-------------------------------------------------------------------------

  /**
   * @java LeadChange.startNewTrial(Context, Trial)
   */
  public startNewTrial(_context: Context, _fullTrial: Trial): void {
    console.error("Incrementally computing metric not yet implemented for LeadChange.");
  }

  /**
   * @java LeadChange.observeNextState(Context)
   */
  public observeNextState(_context: Context): void {
    console.error("Incrementally computing metric not yet implemented for LeadChange.");
  }

  /**
   * @java LeadChange.observeFinalState(Context)
   */
  public observeFinalState(_context: Context): void {
    console.error("Incrementally computing metric not yet implemented for LeadChange.");
  }

  /**
   * @java LeadChange.finaliseMetric(Game, int)
   */
  public finaliseMetric(_game: Game, _numTrials: number): number {
    console.error("Incrementally computing metric not yet implemented for LeadChange.");
    return NaN;
  }

  //-------------------------------------------------------------------------
}

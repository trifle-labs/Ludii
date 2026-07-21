// @java Evaluation/src/metrics/single/stateEvaluation/decisiveness/DecisivenessMoves.java

/**
 * Percentage number of moves after a winning player has a state evaluation
 * above the decisiveness threshold.
 *
 * @java metrics/single/stateEvaluation/decisiveness/DecisivenessMoves.java
 * @author matthew.stephenson
 */

import { Metric } from "../../../Metric.js";
import { DecisivenessThreshold } from "./DecisivenessThreshold.js";

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

/** @java other/concept/Concept.DecisivenessMoves */
const ConceptDecisivenessMoves: Concept = "DecisivenessMoves" as unknown as Concept;

//-----------------------------------------------------------------------------

/** @java metrics/Utils — escape hatch */
type UtilsLike = {
  setupNewContext(game: Game, rngState: RandomProviderState): Context;
  evaluateState(evaluation: Evaluation, context: Context, player: number): number;
  highestRankedPlayers(trial: Trial, context: Context): number[];
};

//-----------------------------------------------------------------------------

/**
 * Percentage number of moves after a winning player has a state evaluation
 * above the decisiveness threshold.
 *
 * @java metrics/single/stateEvaluation/decisiveness/DecisivenessMoves.java
 */
export class DecisivenessMoves extends Metric {

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java DecisivenessMoves()
   */
  public constructor() {
    super(
      "Decisiveness Moves",
      "Percentage number of moves after a winning player has a state evaluation above the decisiveness threshold.",
      0.0,
      1.0,
      ConceptDecisivenessMoves,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java DecisivenessMoves.apply(Game, Evaluation, Trial[], RandomProviderState[])
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
      isSimulationMoveGame(): boolean;
      apply(context: Context, move: unknown): void;
    };

    // Cannot perform move/state evaluation for matches.
    if (g.hasSubgames() || g.isSimultaneousMoveGame() || g.isSimulationMoveGame())
      return null;

    // Import Utils via escape hatch
    const Utils = {} as unknown as UtilsLike;

    let avgDecisivenessThreshold = 0.0;
    const trialArr = trials as unknown as Array<{
      generateRealMovesList(): unknown[];
      getMove(index: number): unknown;
    }>;
    const rngArr = randomProviderStates as unknown as RandomProviderState[];

    for (let trialIndex = 0; trialIndex < trialArr.length; trialIndex++) {
      // Get trial and RNG information
      const trial = trialArr[trialIndex]!;
      const rngState = rngArr[trialIndex]!;

      const dt = DecisivenessThreshold.decisivenessThreshold(game, evaluation, trial as unknown as Trial, rngState);

      const context = Utils.setupNewContext(game, rngState);
      const highestRankedPlayers = Utils.highestRankedPlayers(trial as unknown as Trial, context);

      const realMoves = trial.generateRealMovesList();
      let turnAboveDecisivenessthreshold = realMoves.length;
      let aboveThresholdFound = false;

      for (let i = 0; i < realMoves.length; i++) {
        for (const playerIndex of highestRankedPlayers) {
          if (Utils.evaluateState(evaluation, context, playerIndex) > dt) {
            aboveThresholdFound = true;
            turnAboveDecisivenessthreshold = i;
            break;
          }
        }

        if (aboveThresholdFound)
          break;

        try {
          g.apply(context, trial.getMove(i));
        }
        catch (_e) { // To avoid a few exceptions in rare cases.
          return null;
        }
      }

      avgDecisivenessThreshold += turnAboveDecisivenessthreshold / realMoves.length;
    }

    return avgDecisivenessThreshold / trialArr.length;
  }

  //-------------------------------------------------------------------------

  /**
   * @java DecisivenessMoves.startNewTrial(Context, Trial)
   */
  public startNewTrial(_context: Context, _fullTrial: Trial): void {
    console.error("Incrementally computing metric not yet implemented for DecisivenessMoves.");
  }

  /**
   * @java DecisivenessMoves.observeNextState(Context)
   */
  public observeNextState(_context: Context): void {
    console.error("Incrementally computing metric not yet implemented for DecisivenessMoves.");
  }

  /**
   * @java DecisivenessMoves.observeFinalState(Context)
   */
  public observeFinalState(_context: Context): void {
    console.error("Incrementally computing metric not yet implemented for DecisivenessMoves.");
  }

  /**
   * @java DecisivenessMoves.finaliseMetric(Game, int)
   */
  public finaliseMetric(_game: Game, _numTrials: number): number {
    console.error("Incrementally computing metric not yet implemented for DecisivenessMoves.");
    return NaN;
  }

  //-------------------------------------------------------------------------
}

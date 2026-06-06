// @java Evaluation/src/metrics/single/complexity/DecisionMoves.java

/**
 * Percentage number of states in the trial where there was more than 1 possible move.
 *
 * @java metrics/single/complexity/DecisionMoves.java
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

/** @java other/concept/Concept.DecisionMoves */
const ConceptDecisionMoves: Concept = "DecisionMoves" as unknown as Concept;

//-----------------------------------------------------------------------------

/** Helper: get the count of legal moves in the given context */
function numLegalMoves(context: Context): number {
  const ctx = context as unknown as {
    game(): {
      moves(ctx: Context): { moves(): { size(): number } | unknown[] };
    };
  };
  const movesResult = ctx.game().moves(context);
  const moves = (movesResult as unknown as { moves(): unknown }).moves();
  if (typeof (moves as { size?: () => number }).size === "function")
    return (moves as { size(): number }).size();
  return (moves as unknown[]).length;
}

//-----------------------------------------------------------------------------

/**
 * Percentage number of states in the trial where there was more than 1 possible move.
 *
 * @java metrics/single/complexity/DecisionMoves.java
 */
export class DecisionMoves extends Metric {

  //-------------------------------------------------------------------------

  /** For incremental computation. @java DecisionMoves.avgNumDecisionMoves */
  avgNumDecisionMoves: number = 0.0;

  /** For incremental computation. @java DecisionMoves.numDecisionMoves */
  numDecisionMoves: number = 0.0;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java DecisionMoves()
   */
  public constructor() {
    super(
      "Decision Moves",
      "Percentage number of states in the trial where there was more than 1 possible move.",
      0.0,
      1.0,
      ConceptDecisionMoves,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java DecisionMoves.apply(Game, Evaluation, Trial[], RandomProviderState[])
   */
  public apply(
    game: Game,
    _evaluation: Evaluation,
    trials: Trial[],
    randomProviderStates: RandomProviderState[],
  ): number | null {
    const g = game as unknown as {
      moves(ctx: Context): { moves(): { size(): number } | unknown[] };
      apply(ctx: Context, m: Move): void;
    };

    let avgNumDecisionMoves = 0;
    for (let trialIndex = 0; trialIndex < trials.length; trialIndex++) {
      // Get trial and RNG information
      const trial = trials[trialIndex] as unknown as {
        generateRealMovesList(): Move[];
      };
      const rngState = randomProviderStates[trialIndex];

      // Setup a new instance of the game
      const context: Context = setupNewContext(game, rngState);

      // Record the number of possible options for each move.
      let numDecisionMoves = 0;

      const realMoves = trial.generateRealMovesList();
      for (const m of realMoves) {
        if (numLegalMoves(context) > 1)
          numDecisionMoves++;

        g.apply(context, m);
      }

      avgNumDecisionMoves += numDecisionMoves / realMoves.length;
    }

    return avgNumDecisionMoves / trials.length;
  }

  //-------------------------------------------------------------------------

  /**
   * @java DecisionMoves.startNewTrial(Context, Trial)
   */
  public startNewTrial(context: Context, _fullTrial: Trial): void {
    this.numDecisionMoves = 0.0;

    if (numLegalMoves(context) > 1)
      this.numDecisionMoves += 1.0;
  }

  /**
   * @java DecisionMoves.observeNextState(Context)
   */
  public observeNextState(context: Context): void {
    const ctx = context as unknown as {
      trial(): { over(): boolean };
    };
    if (!ctx.trial().over() && numLegalMoves(context) > 1)
      this.numDecisionMoves += 1.0;
  }

  /**
   * @java DecisionMoves.observeFinalState(Context)
   */
  public observeFinalState(context: Context): void {
    const ctx = context as unknown as {
      trial(): { numberRealMoves(): number };
    };
    this.avgNumDecisionMoves += this.numDecisionMoves / ctx.trial().numberRealMoves();
  }

  /**
   * @java DecisionMoves.finaliseMetric(Game, int)
   */
  public finaliseMetric(_game: Game, numTrials: number): number {
    return this.avgNumDecisionMoves / numTrials;
  }

  //-------------------------------------------------------------------------
}

//-----------------------------------------------------------------------------
// Escape-hatch stub for Utils.setupNewContext (not yet ported)
//-----------------------------------------------------------------------------

function setupNewContext(_game: Game, _rngState: RandomProviderState): Context {
  return (null as unknown as Context);
}

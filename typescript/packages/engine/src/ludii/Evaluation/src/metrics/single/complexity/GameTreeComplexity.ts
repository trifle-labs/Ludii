// @java Evaluation/src/metrics/single/complexity/GameTreeComplexity.java

/**
 * Estimate of the number of possible distinct play traces.
 * https://www.pipmodern.com/post/complexity-state-space-game-tree
 *
 * @java metrics/single/complexity/GameTreeComplexity.java
 * @author matthew.stephenson
 */

import { Metric } from "../../Metric.js";
import { Utils } from "../../Utils.js";

/** Minimal escape-hatch types */
type Game = unknown;
type Trial = unknown;
type Context = unknown;
type RandomProviderState = unknown;
type Evaluation = unknown;

/** Java: Constants.INFINITY */
const INFINITY = Number.POSITIVE_INFINITY;

interface ContextLikeInner {
  game(): GameLike;
}

interface GameLike {
  moves(ctx: ContextLikeInner): { moves(): { size(): number } };
  apply(ctx: ContextLikeInner, move: unknown): void;
}

interface TrialLike {
  generateRealMovesList(): unknown[];
  numberRealMoves(): number;
  over(): boolean;
}

//-----------------------------------------------------------------------------

/**
 * Estimate of the number of possible distinct play traces.
 *
 * @java metrics/single/complexity/GameTreeComplexity.java
 */
export class GameTreeComplexity extends Metric {

  //-------------------------------------------------------------------------

  /** @java GameTreeComplexity.gameTreeComplexity — For incremental computation */
  private gameTreeComplexity: number = 0.0;

  /** @java GameTreeComplexity.numFullTrialMoves — For incremental computation */
  private numFullTrialMoves: number = 0;

  /** @java GameTreeComplexity.branchingFactor — For incremental computation */
  private branchingFactor: number = 0.0;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java GameTreeComplexity()
   */
  public constructor() {
    super(
      "Game Tree Complexity",
      "Estimate of the number of possible distinct play traces. ",
      0.0,
      INFINITY,
      // Concept.GameTreeComplexity — not-yet-ported, use escape hatch
      null,
      null,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java GameTreeComplexity.apply(Game, Evaluation, Trial[], RandomProviderState[])
   */
  public override apply(
    game: Game,
    _evaluation: Evaluation,
    trials: Trial[],
    randomProviderStates: RandomProviderState[],
  ): number | null {
    let gameTreeComplexity = 0.0;

    for (let trialIndex = 0; trialIndex < trials.length; trialIndex++) {
      // Get trial and RNG information
      const trial = trials[trialIndex] as unknown as TrialLike;
      const rngState = randomProviderStates[trialIndex] as RandomProviderState;

      // Setup a new instance of the game
      const context = Utils.setupNewContext(game, rngState) as unknown as ContextLikeInner;
      const realMoves = trial.generateRealMovesList();

      let branchingFactor = 0.0;
      for (const m of realMoves) {
        branchingFactor += context.game().moves(context).moves().size() / realMoves.length;
        context.game().apply(context, m);
      }

      gameTreeComplexity += realMoves.length * Math.log10(branchingFactor);
    }

    return gameTreeComplexity / trials.length;
  }

  //-------------------------------------------------------------------------

  /**
   * @java GameTreeComplexity.startNewTrial(Context, Trial)
   */
  public override startNewTrial(context: Context, fullTrial: Trial): void {
    const ctx = context as unknown as ContextLikeInner;
    const t = fullTrial as unknown as TrialLike;
    this.branchingFactor = 0.0;
    this.numFullTrialMoves = t.numberRealMoves();

    this.branchingFactor += ctx.game().moves(ctx).moves().size() / this.numFullTrialMoves;
  }

  /**
   * @java GameTreeComplexity.observeNextState(Context)
   */
  public override observeNextState(context: Context): void {
    const ctx = context as unknown as ContextLikeInner & { trial(): TrialLike };
    if (!ctx.trial().over())
      this.branchingFactor += ctx.game().moves(ctx).moves().size() / this.numFullTrialMoves;
  }

  /**
   * @java GameTreeComplexity.observeFinalState(Context)
   */
  public override observeFinalState(_context: Context): void {
    this.gameTreeComplexity += this.numFullTrialMoves * Math.log10(this.branchingFactor);
  }

  /**
   * @java GameTreeComplexity.finaliseMetric(Game, int)
   */
  public override finaliseMetric(_game: Game, numTrials: number): number {
    return this.gameTreeComplexity / numTrials;
  }

  //-------------------------------------------------------------------------
}

// @java Evaluation/src/metrics/multiple/metrics/BranchingFactor.java

/**
 * Number of possible moves.
 *
 * @java metrics/multiple/metrics/BranchingFactor.java
 * @author matthew.stephenson
 */

import { MultiMetricFramework, MultiMetricValue } from "../MultiMetricFramework.js";

/** Minimal escape-hatch types */
type Evaluation = unknown;
type Trial = unknown;
type Context = unknown;
type Game = unknown;

/** Java: Constants.INFINITY */
const INFINITY = Number.POSITIVE_INFINITY;

/** Escape-hatch interface for Context */
interface ContextLike {
  game(): GameLike;
  trial(): { over(): boolean };
}

interface GameLike {
  moves(ctx: ContextLike): { moves(): MovesLike };
  apply(ctx: ContextLike, move: unknown): void;
}

interface MovesLike {
  size(): number;
}

interface TrialLike {
  generateRealMovesList(): unknown[];
}

//-----------------------------------------------------------------------------

/**
 * Number of possible moves.
 *
 * @java metrics/multiple/metrics/BranchingFactor.java
 */
export class BranchingFactor extends MultiMetricFramework {

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java BranchingFactor(MultiMetricValue, Concept)
   */
  public constructor(multiMetricValue: MultiMetricValue, concept: unknown) {
    super(
      "Branching Factor " + multiMetricValue,
      "Number of possible moves.",
      0.0,
      INFINITY,
      concept,
      multiMetricValue,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java BranchingFactor.getMetricValueList(Evaluation, Trial, Context)
   */
  public override getMetricValueList(
    _evaluation: Evaluation,
    trial: Trial,
    context: Context,
  ): Array<number | null> {
    const ctx = context as unknown as ContextLike;
    const t = trial as unknown as TrialLike;
    const valueList: Array<number | null> = [];

    for (const m of t.generateRealMovesList()) {
      valueList.push(ctx.game().moves(ctx).moves().size());
      ctx.game().apply(ctx, m);
    }

    return valueList;
  }

  //-------------------------------------------------------------------------

  /**
   * @java BranchingFactor.startNewTrial(Context, Trial)
   */
  public override startNewTrial(context: Context, _fullTrial: Trial): void {
    const ctx = context as unknown as ContextLike;
    this.currValueList = [];
    this.currValueList.push(ctx.game().moves(ctx).moves().size());
  }

  /**
   * @java BranchingFactor.observeNextState(Context)
   */
  public override observeNextState(context: Context): void {
    const ctx = context as unknown as ContextLike;
    if (!ctx.trial().over())
      this.currValueList.push(ctx.game().moves(ctx).moves().size());
  }

  //-------------------------------------------------------------------------
}

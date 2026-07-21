// @java Evaluation/src/metrics/multiple/metrics/DecisionFactor.java

/**
 * Number of possible moves, when greater than 1.
 *
 * @java metrics/multiple/metrics/DecisionFactor.java
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
  moves(ctx: ContextLike): { moves(): { size(): number } };
  apply(ctx: ContextLike, move: unknown): void;
}

interface TrialLike {
  generateRealMovesList(): unknown[];
}

//-----------------------------------------------------------------------------

/**
 * Number of possible moves, when greater than 1.
 *
 * @java metrics/multiple/metrics/DecisionFactor.java
 */
export class DecisionFactor extends MultiMetricFramework {

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java DecisionFactor(MultiMetricValue, Concept)
   */
  public constructor(multiMetricValue: MultiMetricValue, concept: unknown) {
    super(
      "Decision Factor " + multiMetricValue,
      "Number of possible moves, when greater than 1.",
      0.0,
      INFINITY,
      concept,
      multiMetricValue,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java DecisionFactor.getMetricValueList(Evaluation, Trial, Context)
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
      if (ctx.game().moves(ctx).moves().size() > 1)
        valueList.push(ctx.game().moves(ctx).moves().size());
      ctx.game().apply(ctx, m);
    }

    return valueList;
  }

  //-------------------------------------------------------------------------

  /**
   * @java DecisionFactor.startNewTrial(Context, Trial)
   */
  public override startNewTrial(context: Context, _fullTrial: Trial): void {
    const ctx = context as unknown as ContextLike;
    this.currValueList = [];

    if (ctx.game().moves(ctx).moves().size() > 1)
      this.currValueList.push(ctx.game().moves(ctx).moves().size());
  }

  /**
   * @java DecisionFactor.observeNextState(Context)
   */
  public override observeNextState(context: Context): void {
    const ctx = context as unknown as ContextLike;
    if (!ctx.trial().over() && ctx.game().moves(ctx).moves().size() > 1)
      this.currValueList.push(ctx.game().moves(ctx).moves().size());
  }

  //-------------------------------------------------------------------------
}

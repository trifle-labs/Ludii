// @java Evaluation/src/metrics/multiple/metrics/MoveEvaluation.java

/**
 * Evaluation values for each move.
 *
 * @java metrics/multiple/metrics/MoveEvaluation.java
 * @author matthew.stephenson
 */

import { MultiMetricFramework, MultiMetricValue } from "../MultiMetricFramework.js";
import { Evaluation } from "../../Evaluation.js";
import { Utils } from "../../Utils.js";

/** Minimal escape-hatch types */
type Trial = unknown;
type Context = unknown;
type Game = unknown;

/** Escape-hatch interface for Trial */
interface TrialLike {
  generateRealMovesList(): MoveInterface[];
}

interface MoveInterface {
  [key: string]: unknown;
}

/** Escape-hatch interface for Context (compatible with Utils) */
type ContextLike = Parameters<typeof Utils.evaluateMove>[1];

interface GameLike {
  apply(ctx: ContextLike, move: MoveInterface): void;
}

//-----------------------------------------------------------------------------

/**
 * Evaluation values for each move.
 *
 * @java metrics/multiple/metrics/MoveEvaluation.java
 */
export class MoveEvaluation extends MultiMetricFramework {

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java MoveEvaluation(MultiMetricValue, Concept)
   */
  public constructor(multiMetricValue: MultiMetricValue, concept: unknown) {
    super(
      "Move Evaluation " + multiMetricValue,
      "Evaluation values for each move.",
      0.0,
      1.0,
      concept,
      multiMetricValue,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java MoveEvaluation.getMetricValueList(Evaluation, Trial, Context)
   */
  public override getMetricValueList(
    evaluation: unknown,
    trial: Trial,
    context: Context,
  ): Array<number | null> {
    const eval_ = evaluation as Evaluation;
    const ctx = context as unknown as ContextLike;
    const t = trial as unknown as TrialLike;
    const valueList: Array<number | null> = [];

    for (const m of t.generateRealMovesList()) {
      valueList.push(Utils.evaluateMove(eval_, ctx, m));
      (ctx.game() as unknown as GameLike).apply(ctx, m);
    }

    return valueList;
  }

  //-------------------------------------------------------------------------

  /**
   * @java MoveEvaluation.startNewTrial(Context, Trial)
   */
  public override startNewTrial(_context: Context, _fullTrial: Trial): void {
    console.error("Incrementally computing metric not yet implemented for MoveEvaluation.");
  }

  /**
   * @java MoveEvaluation.observeNextState(Context)
   */
  public override observeNextState(_context: Context): void {
    console.error("Incrementally computing metric not yet implemented for MoveEvaluation.");
  }

  //-------------------------------------------------------------------------
}

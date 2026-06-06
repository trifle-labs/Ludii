// @java Evaluation/src/metrics/multiple/metrics/PieceNumber.java

/**
 * The number of pieces on the board.
 *
 * @java metrics/multiple/metrics/PieceNumber.java
 * @author matthew.stephenson
 */

import { MultiMetricFramework, MultiMetricValue } from "../MultiMetricFramework.js";
import { Utils } from "../../Utils.js";

/** Minimal escape-hatch types */
type Evaluation = unknown;
type Trial = unknown;
type Context = unknown;
type Game = unknown;

/** Java: Constants.INFINITY */
const INFINITY = Number.POSITIVE_INFINITY;

/** Escape-hatch interface for Context (compatible with Utils) */
type ContextLike = Parameters<typeof Utils.numPieces>[0];

interface TrialLike {
  generateRealMovesList(): MoveInterface[];
}

interface MoveInterface {
  [key: string]: unknown;
}

interface GameLike {
  apply(ctx: ContextLike, move: MoveInterface): void;
}

//-----------------------------------------------------------------------------

/**
 * The number of pieces on the board.
 *
 * @java metrics/multiple/metrics/PieceNumber.java
 */
export class PieceNumber extends MultiMetricFramework {

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java PieceNumber(MultiMetricValue, Concept)
   */
  public constructor(multiMetricValue: MultiMetricValue, concept: unknown) {
    super(
      "Piece Number " + multiMetricValue,
      "The number of pieces on the board.",
      0.0,
      INFINITY,
      concept,
      multiMetricValue,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java PieceNumber.getMetricValueList(Evaluation, Trial, Context)
   */
  public override getMetricValueList(
    _evaluation: Evaluation,
    trial: Trial,
    context: Context,
  ): Array<number | null> {
    const ctx = context as unknown as ContextLike;
    const t = trial as unknown as TrialLike;
    const valueList: Array<number | null> = [];

    valueList.push(Utils.numPieces(ctx));
    for (const m of t.generateRealMovesList()) {
      (ctx.game() as unknown as GameLike).apply(ctx, m);
      valueList.push(Utils.numPieces(ctx));
    }

    return valueList;
  }

  //-------------------------------------------------------------------------

  /**
   * @java PieceNumber.startNewTrial(Context, Trial)
   */
  public override startNewTrial(context: Context, _fullTrial: Trial): void {
    const ctx = context as unknown as ContextLike;
    this.currValueList = [];
    this.currValueList.push(Utils.numPieces(ctx));
  }

  /**
   * @java PieceNumber.observeNextState(Context)
   */
  public override observeNextState(context: Context): void {
    const ctx = context as unknown as ContextLike;
    this.currValueList.push(Utils.numPieces(ctx));
  }

  //-------------------------------------------------------------------------
}

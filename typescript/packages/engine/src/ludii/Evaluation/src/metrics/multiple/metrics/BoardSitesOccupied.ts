// @java Evaluation/src/metrics/multiple/metrics/BoardSitesOccupied.java

/**
 * Percentage of board sites which have a piece on it.
 * Note. Only looks at the default site type.
 *
 * @java metrics/multiple/metrics/BoardSitesOccupied.java
 * @author matthew.stephenson
 */

import { MultiMetricFramework, MultiMetricValue } from "../MultiMetricFramework.js";
import { Utils } from "../../Utils.js";

/** Minimal escape-hatch types */
type Evaluation = unknown;
type Trial = unknown;
type Context = unknown;
type Game = unknown;

/** Escape-hatch interface for Context (compatible with Utils) */
type ContextLike = Parameters<typeof Utils.boardDefaultSitesCovered>[0];

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
 * Percentage of board sites which have a piece on it.
 *
 * @java metrics/multiple/metrics/BoardSitesOccupied.java
 */
export class BoardSitesOccupied extends MultiMetricFramework {

  //-------------------------------------------------------------------------

  /** @java BoardSitesOccupied.numberDefaultBoardSites — For incremental computation */
  protected numberDefaultBoardSites: number = 0;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java BoardSitesOccupied(MultiMetricValue, Concept)
   */
  public constructor(multiMetricValue: MultiMetricValue, concept: unknown) {
    super(
      "Board Sites Occupied " + multiMetricValue,
      "Percentage of board sites which have a piece on it.",
      0.0,
      1.0,
      concept,
      multiMetricValue,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java BoardSitesOccupied.getMetricValueList(Evaluation, Trial, Context)
   */
  public override getMetricValueList(
    _evaluation: Evaluation,
    trial: Trial,
    context: Context,
  ): Array<number | null> {
    const ctx = context as unknown as ContextLike;
    const t = trial as unknown as TrialLike;
    const valueList: Array<number | null> = [];

    const numberDefaultBoardSites = ctx.board().topology().getGraphElements(ctx.board().defaultSite()).length;
    valueList.push(Utils.boardDefaultSitesCovered(ctx).length / numberDefaultBoardSites);

    for (const m of t.generateRealMovesList()) {
      (ctx.game() as unknown as GameLike).apply(ctx, m);
      valueList.push(Utils.boardDefaultSitesCovered(ctx).length / numberDefaultBoardSites);
    }

    return valueList;
  }

  //-------------------------------------------------------------------------

  /**
   * @java BoardSitesOccupied.startNewTrial(Context, Trial)
   */
  public override startNewTrial(context: Context, _fullTrial: Trial): void {
    const ctx = context as unknown as ContextLike;
    this.currValueList = [];
    this.numberDefaultBoardSites = ctx.board().topology().getGraphElements(ctx.board().defaultSite()).length;
    this.currValueList.push(Utils.boardDefaultSitesCovered(ctx).length / this.numberDefaultBoardSites);
  }

  /**
   * @java BoardSitesOccupied.observeNextState(Context)
   */
  public override observeNextState(context: Context): void {
    const ctx = context as unknown as ContextLike;
    this.currValueList.push(Utils.boardDefaultSitesCovered(ctx).length / this.numberDefaultBoardSites);
  }

  //-------------------------------------------------------------------------
}

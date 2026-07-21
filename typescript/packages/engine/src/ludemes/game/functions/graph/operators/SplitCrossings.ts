/**
 * @java Core/src/game/functions/graph/operators/SplitCrossings.java
 * Splits edge crossings to create a new vertex at each crossing point.
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";
import { splitCrossings as splitCrossingsOp } from "../../../../../eval/graph/operators.js";

/**
 * SplitCrossings operator: add vertex at every edge crossing, then rebuild faces.
 * @java game/functions/graph/operators/SplitCrossings.java
 */
export class SplitCrossings extends BaseGraphFunction {
  private readonly graphFn: GraphFunction;

  /** @java SplitCrossings(GraphFunction graph) */
  constructor(graphFn: GraphFunction) {
    super();
    this._dim = [];
    this.graphFn = graphFn;
  }

  /** @java SplitCrossings.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const graph = this.graphFn.eval(siteType);
    // @java SplitCrossings.eval — splitAtCrossingPoints + splitAtTouchingPoints + makeFaces
    // Delegate to the existing TS operators.ts implementation
    return splitCrossingsOp(graph);
  }
}

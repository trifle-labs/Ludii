/**
 * @java Core/src/game/functions/graph/operators/Skew.java
 * Skews a graph by the specified amount (horizontal shear from minY).
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";

/**
 * Skew operator: horizontal shear from graph's lowest vertex.
 * @java game/functions/graph/operators/Skew.java
 */
export class Skew extends BaseGraphFunction {
  private readonly amount: number;
  private readonly graphFn: GraphFunction;

  /** @java Skew(Float amount, GraphFunction graph) */
  constructor(amount: number, graphFn: GraphFunction) {
    super();
    this._dim = [];
    this.amount = amount;
    this.graphFn = graphFn;
  }

  /** @java Skew.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const graph = this.graphFn.eval(siteType);
    if (graph.vertices.length === 0) return graph;

    // @java Graph.skew(amount): x += (y − minY) * amount
    let minY = Infinity;
    for (const v of graph.vertices) if (v.y < minY) minY = v.y;

    const amt = this.amount;
    return graph.withTransformedCoordinates((x, y) => [x + (y - minY) * amt, y]);
  }
}

/**
 * @java Core/src/game/functions/graph/operators/Trim.java
 * Trims orphan edges and vertices from a graph.
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";

/**
 * Trim operator: remove dangling spurs and isolated vertices.
 * @java game/functions/graph/operators/Trim.java
 */
export class Trim extends BaseGraphFunction {
  private readonly graphFn: GraphFunction;

  /** @java Trim(GraphFunction graph) */
  constructor(graphFn: GraphFunction) {
    super();
    this._dim = [];
    this.graphFn = graphFn;
  }

  /** @java Trim.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const graph = this.graphFn.eval(siteType);
    // @java Graph.trim() — remove orphan edges then orphan vertices
    graph.trim();
    return graph;
  }
}

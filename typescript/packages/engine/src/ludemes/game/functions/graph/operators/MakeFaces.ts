/**
 * @java Core/src/game/functions/graph/operators/MakeFaces.java
 * Recreates all possible non-overlapping faces for the given graph.
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";

/**
 * MakeFaces operator: rebuild bounded faces from current edge set.
 * @java game/functions/graph/operators/MakeFaces.java
 */
export class MakeFaces extends BaseGraphFunction {
  private readonly graphFn: GraphFunction;

  /** @java MakeFaces(GraphFunction graph) */
  constructor(graphFn: GraphFunction) {
    super();
    this._dim = [];
    this.graphFn = graphFn;
  }

  /** @java MakeFaces.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const graph = this.graphFn.eval(siteType);
    // @java Graph.makeFaces(true)
    graph.makeFaces();
    return graph;
  }
}

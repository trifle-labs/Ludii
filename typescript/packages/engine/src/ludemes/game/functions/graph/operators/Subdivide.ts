/**
 * @java Core/src/game/functions/graph/operators/Subdivide.java
 * Subdivides graph cells about their midpoint (centroid spoke-subdivision).
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";

/**
 * Subdivide operator: split each cell with ≥ min sides about its centroid.
 * @java game/functions/graph/operators/Subdivide.java
 */
export class Subdivide extends BaseGraphFunction {
  private readonly graphFn: GraphFunction;
  private readonly min: number;

  /** @java Subdivide(GraphFunction graph, DimFunction min) */
  constructor(graphFn: GraphFunction, min = 1) {
    super();
    this._dim = [];
    this.graphFn = graphFn;
    this.min = min;
  }

  /** @java Subdivide.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const graph = this.graphFn.eval(siteType);
    // @java Subdivide.eval — delegate to Graph.subdivide(min, cellMode)
    const cellMode = siteType === "Cell";
    graph.subdivide(this.min, cellMode);
    return graph;
  }
}

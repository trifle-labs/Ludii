/**
 * @java Core/src/game/functions/graph/operators/Shift.java
 * Translates a graph by the specified dx, dy (and optionally dz).
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";

/**
 * Shift operator: translate graph vertices.
 * @java game/functions/graph/operators/Shift.java
 */
export class Shift extends BaseGraphFunction {
  private readonly dx: number;
  private readonly dy: number;
  private readonly graphFn: GraphFunction;

  /** @java Shift(FloatFunction dx, FloatFunction dy, FloatFunction dz, GraphFunction graph) */
  constructor(dx: number, dy: number, graphFn: GraphFunction) {
    super();
    this._dim = [];
    this.dx = dx;
    this.dy = dy;
    this.graphFn = graphFn;
  }

  /** @java Shift.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const graph = this.graphFn.eval(siteType);
    if (graph.vertices.length === 0) return graph;

    const dx = this.dx;
    const dy = this.dy;

    // @java Graph.translate(dx, dy, dz)
    return graph.withTransformedCoordinates((x, y) => [x + dx, y + dy]);
  }
}

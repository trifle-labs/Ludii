/**
 * @java Core/src/game/functions/graph/operators/Rotate.java
 * Rotates a graph by the specified number of degrees anticlockwise about midpoint.
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";

/**
 * Rotate operator: rotate graph anticlockwise about bounding-box midpoint.
 * @java game/functions/graph/operators/Rotate.java
 */
export class Rotate extends BaseGraphFunction {
  private readonly degrees: number;
  private readonly graphFn: GraphFunction;

  /** @java Rotate(FloatFunction degreesFn, GraphFunction graph) */
  constructor(degrees: number, graphFn: GraphFunction) {
    super();
    this._dim = [];
    this.degrees = degrees;
    this.graphFn = graphFn;
  }

  /** @java Rotate.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const graph = this.graphFn.eval(siteType);
    if (graph.vertices.length === 0) return graph;

    const a = (this.degrees * Math.PI) / 180;
    const c = Math.cos(a);
    const s = Math.sin(a);

    // Rotate about bounding-box midpoint (@java Graph.rotate uses midpoint)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const v of graph.vertices) {
      if (v.x < minX) minX = v.x;
      if (v.x > maxX) maxX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.y > maxY) maxY = v.y;
    }
    const px = minX + (maxX - minX) / 2;
    const py = minY + (maxY - minY) / 2;

    return graph.withTransformedCoordinates((x, y) => {
      const dx = x - px;
      const dy = y - py;
      return [px + dx * c - dy * s, py + dy * c + dx * s];
    });
  }
}

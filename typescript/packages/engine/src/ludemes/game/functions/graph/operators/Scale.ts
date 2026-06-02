/**
 * @java Core/src/game/functions/graph/operators/Scale.java
 * Scales a graph by the specified amount in x, y (and optionally z).
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";

/**
 * Scale operator: scale vertex coordinates about the origin.
 * @java game/functions/graph/operators/Scale.java
 */
export class Scale extends BaseGraphFunction {
  private readonly scaleX: number;
  private readonly scaleY: number;
  private readonly graphFn: GraphFunction;

  /** @java Scale(FloatFunction scaleX, FloatFunction scaleY, FloatFunction scaleZ, GraphFunction graph) */
  constructor(scaleX: number, graphFn: GraphFunction, scaleY?: number) {
    super();
    this._dim = [];
    this.scaleX = scaleX;
    this.scaleY = scaleY ?? scaleX;
    this.graphFn = graphFn;
  }

  /** @java Scale.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const graph = this.graphFn.eval(siteType);
    if (graph.vertices.length === 0) return graph;

    const sx = this.scaleX;
    const sy = this.scaleY;

    // @java Graph.scale(sx, sy, sz) — mutates vertices in place; TS uses immutable transform
    return graph.withTransformedCoordinates((x, y) => [x * sx, y * sy]);
  }
}

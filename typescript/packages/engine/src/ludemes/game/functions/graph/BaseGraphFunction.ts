/**
 * BaseGraphFunction — faithful 1:1 port.
 * @java game/functions/graph/BaseGraphFunction.java
 *
 * Shared helper: createGraphFromVertexList — add vertices, join pairs that are
 * exactly `unit` apart, build faces, and return the Graph.
 */

import { Graph } from "../../../../eval/graph/graph.js";
import type { GraphFunction } from "./GraphFunction.js";

export const UNIT = 1.0;
export const TOLERANCE = 0.001;

/**
 * @java BaseGraphFunction.createGraphFromVertexList — join every pair of
 * vertices whose Euclidean distance equals `u` (within 0.01) as an undirected
 * edge, then call makeFaces().
 */
export function createGraphFromVertexList(
  vertexList: readonly (readonly [number, number])[],
  u: number,
): Graph {
  const graph = new Graph();
  for (const [x, y] of vertexList) graph.addVertex(x, y, 0.1);
  const vs = graph.vertices;
  for (let a = 0; a < vs.length; a += 1) {
    const va = vs[a]!;
    for (let b = a + 1; b < vs.length; b += 1) {
      const vb = vs[b]!;
      const dist = Math.sqrt((va.x - vb.x) ** 2 + (va.y - vb.y) ** 2);
      if (Math.abs(dist - u) < 0.01) graph.addEdge(a, b);
    }
  }
  graph.makeFaces();
  return graph;
}

/** Abstract base: subclasses implement eval(siteType). */
export abstract class BaseGraphFunction implements GraphFunction {
  protected _dim: number[] = [];

  /** @java BaseGraphFunction.dim() */
  public dim(): number[] { return this._dim; }

  /** @java BaseGraphFunction.eval(Context, SiteType) */
  public abstract eval(siteType: string): Graph;

  // dim() is implemented above
}

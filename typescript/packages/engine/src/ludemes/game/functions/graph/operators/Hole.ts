/**
 * @java Core/src/game/functions/graph/operators/Hole.java
 * Cuts a hole in a graph according to a specified polygon shape.
 * Removes any face whose midpoint falls within the hole (inflated by 0.1).
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";

/** Ray-cast point-in-polygon. @java Polygon.contains */
function polyContains(
  poly: ReadonlyArray<readonly [number, number]>,
  px: number,
  py: number,
): boolean {
  const n = poly.length;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
    const pi = poly[i]!;
    const pj = poly[j]!;
    const cross =
      (pi[1] > py) !== (pj[1] > py) &&
      px < ((pj[0] - pi[0]) * (py - pi[1])) / (pj[1] - pi[1]) + pi[0];
    if (cross) inside = !inside;
  }
  return inside;
}

/** Inflate polygon outward from centroid. @java Polygon.inflate */
function inflate(
  poly: ReadonlyArray<readonly [number, number]>,
  amount: number,
): ReadonlyArray<readonly [number, number]> {
  let cx = 0, cy = 0;
  for (const [x, y] of poly) { cx += x; cy += y; }
  cx /= poly.length; cy /= poly.length;
  return poly.map(([x, y]) => {
    const dx = x - cx, dy = y - cy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return [x + (dx / len) * amount, y + (dy / len) * amount] as const;
  });
}

type Pt = readonly [number, number];

/**
 * Hole operator: remove all faces whose centroids lie inside the polygon.
 * @java game/functions/graph/operators/Hole.java
 */
export class Hole extends BaseGraphFunction {
  private readonly graphFn: GraphFunction;
  private readonly polygon: ReadonlyArray<Pt>;

  /** @java Hole(GraphFunction graphFn, Poly poly) */
  constructor(graphFn: GraphFunction, polygon: ReadonlyArray<Pt>) {
    super();
    this._dim = [];
    this.graphFn = graphFn;
    this.polygon = polygon;
  }

  /** @java Hole.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const graph = this.graphFn.eval(siteType);

    if (this.polygon.length < 3) return graph;

    const poly = inflate(this.polygon, 0.1);

    // @java Hole.eval — remove faces whose midpoint falls inside the polygon
    const drop: number[] = [];
    for (let fid = graph.faces.length - 1; fid >= 0; fid -= 1) {
      const face = graph.faces[fid];
      if (face && polyContains(poly, face.cx, face.cy)) drop.push(fid);
    }
    if (drop.length > 0) graph.removeFacesByIndex(drop);

    return graph;
  }
}

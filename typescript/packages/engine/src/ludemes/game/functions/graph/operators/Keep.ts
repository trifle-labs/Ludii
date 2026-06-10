/**
 * @java Core/src/game/functions/graph/operators/Keep.java
 * Keeps a specified shape within a graph and discards the remainder.
 * Vertices INSIDE the polygon are kept; those outside are removed.
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
 * Keep operator: retain only vertices inside the polygon and their edges.
 * @java game/functions/graph/operators/Keep.java
 */
export class Keep extends BaseGraphFunction {
  private readonly graphFn: GraphFunction;
  private readonly polygon: ReadonlyArray<Pt>;

  /** @java Keep(GraphFunction graphFn, Poly poly) */
  constructor(graphFn: GraphFunction, polygon: ReadonlyArray<Pt> | unknown) {
    super();
    this._dim = [];
    this.graphFn = graphFn;
    // The compiler passes the Java-signature Poly ludeme; older callers pass raw
    // point-pair arrays. Normalize to pairs (@java Hole.java: poly.polygon().points()).
    const polyObj = polygon as unknown as {
      polygon?: () => { points(): ReadonlyArray<{ x: number; y: number }> };
      points?: () => ReadonlyArray<{ x: number; y: number }>;
    };
    this.polygon = typeof polyObj?.polygon === "function"
      ? polyObj.polygon().points().map((pt) => [pt.x, pt.y] as const)
      : typeof polyObj?.points === "function"
        ? polyObj.points().map((pt) => [pt.x, pt.y] as const)
        : (polygon as ReadonlyArray<Pt>);
  }

  /** @java Keep.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const source = this.graphFn.eval(siteType);

    if (this.polygon.length < 3) return source;

    const poly = inflate(this.polygon, 0.1);

    // @java Keep.eval — mark vertices outside polygon for removal
    const removeSet = new Set<number>();
    for (const v of source.vertices)
      if (!polyContains(poly, v.x, v.y)) removeSet.add(v.id);

    // Build new graph with only kept vertices and edges between them
    const out = new Graph();
    const remap = new Map<number, number>();
    for (const v of source.vertices) {
      if (removeSet.has(v.id)) continue;
      remap.set(v.id, out.addVertex(v.x, v.y));
    }
    for (const e of source.edges) {
      const a = remap.get(e.a);
      const b = remap.get(e.b);
      if (a !== undefined && b !== undefined) out.addEdge(a, b);
    }

    return out;
  }
}

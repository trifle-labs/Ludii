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
// @java main.math.Polygon.inflate(amount) — adjusts each vertex along the
// AVERAGE of its two adjacent edge directions (not radially from the centroid).
// For a CCW polygon both edge vectors point inward, so inflate(0.1) actually
// DEFLATES — the old centroid-radial version EXPANDED instead, so Go-with-the-
// Floe's (keep (poly …)) diamond kept 60 cells instead of Java's 52, giving a
// completely different board topology and site numbering.
function inflate(
  poly: ReadonlyArray<readonly [number, number]>,
  amount: number,
): ReadonlyArray<readonly [number, number]> {
  const n = poly.length;
  // @java MathRoutines.clockwise(a,b,c): (b.x-a.x)(c.y-a.y) − (c.x-a.x)(b.y-a.y) < EPSILON.
  const EPSILON = 0.0000001;
  const clockwise = (a: readonly [number, number], b: readonly [number, number], c: readonly [number, number]): boolean =>
    (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]) < EPSILON;
  const adjustments: Array<readonly [number, number]> = [];
  for (let i = 0; i < n; i++) {
    const ptA = poly[i]!, ptB = poly[(i + 1) % n]!, ptC = poly[(i + 2) % n]!;
    // @java Vector(p,q) = q − p.
    const [vecIn, vecOut] = clockwise(ptA, ptB, ptC)
      ? [[ptB[0] - ptA[0], ptB[1] - ptA[1]], [ptB[0] - ptC[0], ptB[1] - ptC[1]]] // Vector(ptA,ptB), Vector(ptC,ptB)
      : [[ptA[0] - ptB[0], ptA[1] - ptB[1]], [ptC[0] - ptB[0], ptC[1] - ptB[1]]]; // Vector(ptB,ptA), Vector(ptB,ptC)
    const liIn = Math.hypot(vecIn[0]!, vecIn[1]!) || 1;
    const liOut = Math.hypot(vecOut[0]!, vecOut[1]!) || 1;
    adjustments.push([
      (vecIn[0]! / liIn * amount + vecOut[0]! / liOut * amount) * 0.5,
      (vecIn[1]! / liIn * amount + vecOut[1]! / liOut * amount) * 0.5,
    ]);
  }
  // @java the adjustment for point n is the one computed when n was ptB (i=n-1).
  return poly.map(([x, y], i) => {
    const adj = adjustments[(i - 1 + n) % n]!;
    return [x + adj[0]!, y + adj[1]!] as const;
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

    // @java Board.java measures the kept graph (graph.makeFaces()) so the
    // subgraph regains its bounded faces (= Cells). Without this the kept graph
    // had 0 faces, Board.buildTopology fell back to Vertex play, and the Cell
    // coordinate placements in the start rules (Go with the Floe's `{"G2" "G7"}`)
    // found no cells → silently placed nothing → empty board.
    out.makeFaces();

    return out;
  }
}

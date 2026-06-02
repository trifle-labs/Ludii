/**
 * @java Core/src/game/functions/graph/operators/Remove.java
 * Removes vertices, edges and/or faces from a graph.
 *
 * Vertex/edge removal is implemented by rebuilding the graph without the
 * dropped elements, since the TS Graph class has no in-place removeVertex /
 * removeEdge methods.
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";

/** Ray-cast point-in-polygon — @java Polygon.contains. */
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
    const intersect =
      (pi[1] > py) !== (pj[1] > py) &&
      px < ((pj[0] - pi[0]) * (py - pi[1])) / (pj[1] - pi[1]) + pi[0];
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Inflate a polygon slightly outward from its centroid. @java Polygon.inflate */
function inflate(
  poly: ReadonlyArray<readonly [number, number]>,
  amount: number,
): ReadonlyArray<readonly [number, number]> {
  let cx = 0;
  let cy = 0;
  for (const [x, y] of poly) { cx += x; cy += y; }
  cx /= poly.length;
  cy /= poly.length;
  return poly.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return [x + (dx / len) * amount, y + (dy / len) * amount] as const;
  });
}

/** Rebuild a graph without the specified vertex ids. */
function graphWithoutVertices(source: Graph, dropVids: ReadonlySet<number>): Graph {
  const out = new Graph();
  const remap = new Map<number, number>();
  for (const v of source.vertices) {
    if (dropVids.has(v.id)) continue;
    remap.set(v.id, out.addVertex(v.x, v.y));
  }
  for (const e of source.edges) {
    const a = remap.get(e.a);
    const b = remap.get(e.b);
    if (a !== undefined && b !== undefined) out.addEdge(a, b);
  }
  // Re-add surviving faces
  for (const f of source.faces) {
    if (f.vertices.some((v) => dropVids.has(v))) continue;
    const vids = f.vertices.map((v) => remap.get(v) as number);
    if (vids.every((v) => v >= 0)) out.findOrAddFace(vids);
  }
  return out;
}

/** Rebuild a graph without the specified edge (a,b). */
function graphWithoutEdges(
  source: Graph,
  dropEdges: ReadonlySet<string>,
): Graph {
  const out = new Graph();
  for (const v of source.vertices) out.addVertex(v.x, v.y);
  for (const e of source.edges) {
    const k = e.a < e.b ? `${e.a}:${e.b}` : `${e.b}:${e.a}`;
    if (!dropEdges.has(k)) out.addEdge(e.a, e.b);
  }
  for (const f of source.faces) out.findOrAddFace([...f.vertices]);
  return out;
}

type Pt = readonly [number, number];

/**
 * Remove operator: delete vertices, edges and/or faces.
 * @java game/functions/graph/operators/Remove.java
 */
export class Remove extends BaseGraphFunction {
  private readonly graphFn: GraphFunction;
  private readonly polygon: ReadonlyArray<Pt> | null;
  private readonly facePositions: ReadonlyArray<ReadonlyArray<Pt>>;
  private readonly faceIndices: ReadonlyArray<number>;
  private readonly edgePositions: ReadonlyArray<readonly [Pt, Pt]>;
  private readonly edgeIndices: ReadonlyArray<readonly [number, number]>;
  private readonly vertexPositions: ReadonlyArray<Pt>;
  private readonly vertexIndices: ReadonlyArray<number>;

  constructor(
    graphFn: GraphFunction,
    args: {
      polygon?: ReadonlyArray<Pt> | null;
      facePositions?: ReadonlyArray<ReadonlyArray<Pt>>;
      faceIndices?: ReadonlyArray<number>;
      edgePositions?: ReadonlyArray<readonly [Pt, Pt]>;
      edgeIndices?: ReadonlyArray<readonly [number, number]>;
      vertexPositions?: ReadonlyArray<Pt>;
      vertexIndices?: ReadonlyArray<number>;
    } = {},
  ) {
    super();
    this._dim = [];
    this.graphFn = graphFn;
    this.polygon = args.polygon ?? null;
    this.facePositions = args.facePositions ?? [];
    this.faceIndices = args.faceIndices ?? [];
    this.edgePositions = args.edgePositions ?? [];
    this.edgeIndices = args.edgeIndices ?? [];
    this.vertexPositions = args.vertexPositions ?? [];
    this.vertexIndices = args.vertexIndices ?? [];
  }

  /** @java Remove.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    let graph = this.graphFn.eval(siteType);

    // Polygon-based removal: remove vertices inside the polygon
    if (this.polygon != null && this.polygon.length >= 3) {
      const poly = inflate(this.polygon, 0.1);
      const drop = new Set<number>();
      for (const v of graph.vertices)
        if (polyContains(poly, v.x, v.y)) drop.add(v.id);
      if (drop.size > 0) graph = graphWithoutVertices(graph, drop);
    }

    // Remove faces by position (vertex ring coordinates)
    for (const ring of this.facePositions) {
      const vids = ring.map(([x, y]) => graph.findVertex(x, y));
      if (vids.some((v) => v < 0)) continue;
      const fid = findFaceByVerts(graph, vids);
      if (fid >= 0) graph.removeFacesByIndex([fid]);
    }

    // Remove faces by index (descending to preserve indices)
    if (this.faceIndices.length > 0) {
      const sorted = [...this.faceIndices].sort((a, b) => b - a);
      graph.removeFacesByIndex(sorted);
    }

    // Remove edges by coordinate
    if (this.edgePositions.length > 0) {
      const dropEdges = new Set<string>();
      for (const [[ax, ay], [bx, by]] of this.edgePositions) {
        const vA = graph.findVertex(ax, ay);
        const vB = graph.findVertex(bx, by);
        if (vA >= 0 && vB >= 0) {
          const k = vA < vB ? `${vA}:${vB}` : `${vB}:${vA}`;
          dropEdges.add(k);
        }
      }
      if (dropEdges.size > 0) graph = graphWithoutEdges(graph, dropEdges);
    }

    // Remove edges by vertex index pairs
    if (this.edgeIndices.length > 0) {
      const dropEdges = new Set<string>();
      for (const [a, b] of this.edgeIndices) {
        const k = a < b ? `${a}:${b}` : `${b}:${a}`;
        dropEdges.add(k);
      }
      graph = graphWithoutEdges(graph, dropEdges);
    }

    // Remove vertices by position
    if (this.vertexPositions.length > 0) {
      const drop = new Set<number>();
      for (const [x, y] of this.vertexPositions) {
        const vid = graph.findVertex(x, y);
        if (vid >= 0) drop.add(vid);
      }
      if (drop.size > 0) graph = graphWithoutVertices(graph, drop);
    }

    // Remove vertices by index (descending)
    if (this.vertexIndices.length > 0) {
      const drop = new Set<number>(this.vertexIndices);
      graph = graphWithoutVertices(graph, drop);
    }

    return graph;
  }
}

function findFaceByVerts(graph: Graph, vids: number[]): number {
  const want = new Set(vids);
  for (const f of graph.faces) {
    if (
      f.vertices.length === vids.length &&
      f.vertices.every((v) => want.has(v))
    )
      return f.id;
  }
  return -1;
}

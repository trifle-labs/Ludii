/**
 * @java Core/src/game/functions/graph/operators/Intersect.java
 * Returns the intersection of two or more graphs (vertices+edges in all).
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";

/** Euclidean distance between two 2D points. */
function dist2d(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

/**
 * Intersect operator: keep only vertices/edges present in every graph.
 * @java game/functions/graph/operators/Intersect.java
 */
export class Intersect extends BaseGraphFunction {
  private readonly graphFns: GraphFunction[];

  /** @java Intersect(GraphFunction graphA, GraphFunction graphB) */
  constructor(
    graphFnsOrA: GraphFunction[] | GraphFunction,
    graphBOrExtra: GraphFunction | null = null,
    ...extra: Array<GraphFunction | null>
  ) {
    super();
    this._dim = [];
    this.graphFns = normaliseGraphArgs(graphFnsOrA, graphBOrExtra, ...extra);
  }

  /** @java Intersect.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const numGraphs = this.graphFns.length;
    if (numGraphs === 0) return new Graph();

    const graphs = this.graphFns.map((fn) => fn.eval(siteType));

    if (numGraphs === 1) return graphs[0]!;

    const tol = 0.01;
    const base = graphs[0]!;

    // Work from base vertex / edge lists, removing elements not in all others.
    // Build mutable copies (as {x,y,id} arrays)
    const vertices: Array<{ x: number; y: number; id: number }> =
      base.vertices.map((v) => ({ x: v.x, y: v.y, id: v.id }));
    const edges: Array<{ a: number; b: number; id: number }> =
      base.edges.map((e) => ({ a: e.a, b: e.b, id: e.id }));

    // Remove edges not found in all subsequent graphs
    for (let e = edges.length - 1; e >= 0; e -= 1) {
      const edge = edges[e]!;
      const va = vertices[edge.a];
      const vb = vertices[edge.b];
      if (!va || !vb) { edges.splice(e, 1); continue; }

      let foundInAll = true;
      for (let g = 1; g < numGraphs; g += 1) {
        const gEdges = graphs[g]!.edges;
        const gVerts = graphs[g]!.vertices;
        let found = false;
        for (const ge of gEdges) {
          const gva = gVerts[ge.a];
          const gvb = gVerts[ge.b];
          if (!gva || !gvb) continue;
          if (
            (dist2d(va.x, va.y, gva.x, gva.y) < tol && dist2d(vb.x, vb.y, gvb.x, gvb.y) < tol) ||
            (dist2d(va.x, va.y, gvb.x, gvb.y) < tol && dist2d(vb.x, vb.y, gva.x, gva.y) < tol)
          ) { found = true; break; }
        }
        if (!found) { foundInAll = false; break; }
      }
      if (!foundInAll) edges.splice(e, 1);
    }

    // Remove vertices not found in all subsequent graphs
    for (let v = vertices.length - 1; v >= 0; v -= 1) {
      const vertex = vertices[v]!;
      let foundInAll = true;
      for (let g = 1; g < numGraphs; g += 1) {
        const gVerts = graphs[g]!.vertices;
        let found = false;
        for (const gv of gVerts) {
          if (dist2d(vertex.x, vertex.y, gv.x, gv.y) < tol) { found = true; break; }
        }
        if (!found) { foundInAll = false; break; }
      }
      if (!foundInAll) vertices.splice(v, 1);
    }

    // Rebuild graph from surviving vertices/edges with fresh ids
    const out = new Graph();
    const oldToNew = new Map<number, number>();
    for (let i = 0; i < vertices.length; i += 1) {
      const v = vertices[i]!;
      const nid = out.addVertex(v.x, v.y);
      oldToNew.set(v.id, nid);
    }
    for (const e of edges) {
      const a = oldToNew.get(e.a);
      const b = oldToNew.get(e.b);
      if (a !== undefined && b !== undefined) out.addEdge(a, b);
    }

    return out;
  }
}

function normaliseGraphArgs(
  first: GraphFunction[] | GraphFunction,
  ...rest: Array<GraphFunction | null>
): GraphFunction[] {
  const graphFns: GraphFunction[] = Array.isArray(first) ? [...first] : [first];
  for (const arg of rest) {
    if (arg !== null) graphFns.push(arg);
  }
  return graphFns;
}

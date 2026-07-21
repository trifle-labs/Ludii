/**
 * @java Core/src/game/functions/graph/operators/Merge.java
 * Returns the result of merging two or more graphs (incident vertices merged).
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";

/**
 * Merge operator: overlay graphs, fusing coincident vertices.
 * @java game/functions/graph/operators/Merge.java
 */
export class Merge extends BaseGraphFunction {
  private readonly graphFns: GraphFunction[];
  private readonly connect: boolean;

  /** @java Merge(GraphFunction graphA, GraphFunction graphB, Boolean connect) */
  constructor(
    graphFnsOrA: GraphFunction[] | GraphFunction,
    graphBOrConnect: GraphFunction | boolean | null = null,
    connectOrExtra: boolean | GraphFunction | null = null,
    ...extra: Array<GraphFunction | boolean | null>
  ) {
    super();
    this._dim = [];
    const normalised = normaliseGraphArgs(graphFnsOrA, graphBOrConnect, connectOrExtra, ...extra);
    this.graphFns = normalised.graphFns;
    this.connect = normalised.connect;
  }

  /** @java Merge.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    // Evaluate all child graphs
    const graphs = this.graphFns.map((fn) => fn.eval(siteType));

    // Collate vertices and edges via dedup addVertex (tolerance 0.01)
    const out = new Graph();
    for (const g of graphs) {
      // Re-add vertices with higher tolerance (0.01 as in Java mergeVertices)
      const map = g.vertices.map((v) => out.addVertex(v.x, v.y, 0.01));
      for (const e of g.edges)
        out.addEdge(map[e.a] as number, map[e.b] as number);
      // Carry over pivot mappings
      for (const [k, p] of g.pivots) {
        const nk = map[k];
        const np = map[p];
        if (nk !== undefined && np !== undefined) out.setPivot(nk, np);
      }
    }

    // Connect nearby vertices if requested
    if (this.connect) {
      const threshold = 1.1 * out.averageEdgeLength();
      const vs = out.vertices;
      for (let i = 0; i < vs.length; i += 1) {
        for (let j = i + 1; j < vs.length; j += 1) {
          const a = vs[i]!;
          const b = vs[j]!;
          const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
          if (dist < threshold) out.addEdge(a.id, b.id);
        }
      }
      out.makeFaces();
    }

    // @java Graph.assemble(checkCrossings) — every finalized Java graph makes its
    // faces (Graph.java:1846). Without this, merge boards report 0 faces and the
    // container span (max(numFaces, numPlaySites), Equipment.java maxSiteMainBoard)
    // collapses to the vertex count — Fox and Geese's fox hand landed at 33
    // instead of Java's 40.
    if (!this.connect) out.makeFaces();

    return out;
  }
}

/** Convenience 2-graph factory matching Java's primary constructor. */
export function merge(
  graphA: GraphFunction,
  graphB: GraphFunction,
  connect = false,
): Merge {
  return new Merge([graphA, graphB], connect);
}

function normaliseGraphArgs(
  first: GraphFunction[] | GraphFunction,
  ...rest: Array<GraphFunction | boolean | null>
): { graphFns: GraphFunction[]; connect: boolean } {
  const graphFns: GraphFunction[] = Array.isArray(first) ? [...first] : [first];
  let connect = false;
  for (const arg of rest) {
    if (arg === null) continue;
    if (typeof arg === "boolean") connect = arg;
    else graphFns.push(arg);
  }
  return { graphFns, connect };
}

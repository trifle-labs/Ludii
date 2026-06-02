/**
 * @java Core/src/game/functions/graph/operators/Union.java
 * Returns the union of two or more graphs (simply combined, no vertex merging).
 *
 * Note: The active Java implementation (post-refactor) just appends vertices,
 * edges and faces from each sub-graph into the first graph in-place via
 * `addVertex` / `addEdge` / `addFace` + `synchroniseIds`. In TS we replicate
 * this via a fresh Graph that re-adds all elements from every sub-graph WITHOUT
 * the coincidence dedup (using a very small tolerance = 0 would be ideal, but
 * Graph.addVertex always deduplicates; we use a tiny tolerance so that slightly
 * separated points in truly-different sub-graphs are not fused).
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";

/**
 * Union operator: combine graphs, no automatic vertex merging.
 * @java game/functions/graph/operators/Union.java
 */
export class Union extends BaseGraphFunction {
  private readonly graphFns: GraphFunction[];
  private readonly connect: boolean;

  /** @java Union(GraphFunction graphA, GraphFunction graphB, Boolean connect) */
  constructor(graphFns: GraphFunction[], connect = false) {
    super();
    this._dim = [];
    this.graphFns = graphFns;
    this.connect = connect;
  }

  /** @java Union.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    if (this.graphFns.length === 0) return new Graph();

    // Evaluate all child graphs
    const graphs = this.graphFns.map((fn) => fn.eval(siteType));

    // Start with a copy of the first graph, then append subsequent ones
    const base = graphs[0]!;
    const out = new Graph();
    // Re-add base vertices with tiny tolerance so they are deduplicated only if truly identical
    const map0 = base.vertices.map((v) => out.addVertex(v.x, v.y, 0.001));
    for (const e of base.edges)
      out.addEdge(map0[e.a] as number, map0[e.b] as number);
    for (const f of base.faces) {
      const vids = f.vertices.map((v) => map0[v] as number);
      out.findOrAddFace(vids);
    }

    for (let n = 1; n < graphs.length; n += 1) {
      const g = graphs[n]!;
      const mapN = g.vertices.map((v) => out.addVertex(v.x, v.y, 0.001));
      for (const e of g.edges)
        out.addEdge(mapN[e.a] as number, mapN[e.b] as number);
      for (const f of g.faces) {
        const vids = f.vertices.map((v) => mapN[v] as number);
        out.findOrAddFace(vids);
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

    return out;
  }
}

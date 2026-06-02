/**
 * @java Core/src/game/functions/graph/operators/Complete.java
 * Creates an edge between each pair of vertices in the graph (complete graph).
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";

/**
 * Complete operator: connect every vertex pair.
 * @java game/functions/graph/operators/Complete.java
 */
export class Complete extends BaseGraphFunction {
  private readonly graphFn: GraphFunction;
  private readonly eachCell: boolean;

  /** @java Complete(GraphFunction graph, Boolean eachCell) */
  constructor(graphFn: GraphFunction, eachCell = false) {
    super();
    this._dim = [];
    this.graphFn = graphFn;
    this.eachCell = eachCell;
  }

  /** @java Complete.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const graph = this.graphFn.eval(siteType);

    if (this.eachCell) {
      // @java Complete.eval — eachCell: connect all vertex pairs within each face
      for (const face of graph.faces) {
        const vs = face.vertices;
        for (let va = 0; va < vs.length; va += 1) {
          for (let vb = va + 1; vb < vs.length; vb += 1) {
            graph.addEdge(vs[va] as number, vs[vb] as number);
          }
        }
      }
    } else {
      // @java Complete.eval — global: clear edges then connect every vertex pair
      // TS Graph has no clear(SiteType.Edge) — rebuild from scratch
      const out = new Graph();
      for (const v of graph.vertices) out.addVertex(v.x, v.y);
      const vs = out.vertices;
      for (let va = 0; va < vs.length; va += 1)
        for (let vb = va + 1; vb < vs.length; vb += 1)
          out.addEdge(va, vb);
      out.makeFaces();
      return out;
    }

    return graph;
  }
}

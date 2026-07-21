/**
 * @java Core/src/game/functions/graph/operators/Dual.java
 * Returns the weak dual of the specified graph.
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";

/**
 * Weak dual: create vertex at each face centroid, connect adjacent faces.
 * @java game/functions/graph/operators/Dual.java
 */
export class Dual extends BaseGraphFunction {
  private readonly graphFn: GraphFunction;

  /** @java Dual(GraphFunction graph) */
  constructor(graphFn: GraphFunction) {
    super();
    this._dim = [];
    this.graphFn = graphFn;
  }

  /** @java Dual.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const source = this.graphFn.eval(siteType);

    if (
      source.vertices.length === 0 ||
      source.edges.length === 0 ||
      source.faces.length === 0
    ) {
      return source;
    }

    const out = new Graph();

    // Create vertices at face centroids
    const faceVert = source.faces.map((f) => out.addVertex(f.cx, f.cy));

    // Create edges between adjacent faces (sharing an edge in source)
    const edgeFaces = new Map<string, number[]>();
    const key = (a: number, b: number): string => (a < b ? `${a}:${b}` : `${b}:${a}`);

    source.faces.forEach((f, fi) => {
      const vs = f.vertices;
      for (let i = 0; i < vs.length; i += 1) {
        const k = key(vs[i] as number, vs[(i + 1) % vs.length] as number);
        let arr = edgeFaces.get(k);
        if (!arr) { arr = []; edgeFaces.set(k, arr); }
        arr.push(fi);
      }
    });

    for (const fs of edgeFaces.values()) {
      for (let i = 0; i < fs.length; i += 1)
        for (let j = i + 1; j < fs.length; j += 1)
          out.addEdge(faceVert[fs[i] as number] as number, faceVert[fs[j] as number] as number);
    }

    out.makeFaces();
    out.reorder();

    return out;
  }
}

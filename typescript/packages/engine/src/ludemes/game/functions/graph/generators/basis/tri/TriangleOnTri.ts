/**
 * TriangleOnTri — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/tri/TriangleOnTri.java
 *
 * Defines a triangle-shaped board on a triangular tiling (r > c clip).
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { createGraphFromVertexList, UNIT } from "../../../BaseGraphFunction.js";
import { Basis } from "../Basis.js";

/** @java Tri.xy(row, col) */
export function triXY(row: number, col: number): [number, number] {
  const hx = 1.0;
  const hy = Math.sqrt(3) / 2.0;
  return [hx * (col - 0.5 * row), hy * row];
}

/** @java game/functions/graph/generators/basis/tri/TriangleOnTri.java */
export class TriangleOnTri extends Basis {
  /**
   * @java TriangleOnTri(DimFunction dim)
   * @param d Board dimension.
   */
  public constructor(d: number) {
    super();
    this._dim = [d];
  }

  /** @java TriangleOnTri.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const d = this._dim[0] ?? 1;
    // @java TriangleOnTri.eval:51-52
    const rows = d + (siteType === "Cell" ? 1 : 0);
    const cols = d + (siteType === "Cell" ? 1 : 0);

    // @java lines 55-63 — triangle clip r > c
    const vertexList: [number, number][] = [];
    for (let r = 0; r < rows; r += 1)
      for (let c = 0; c < cols; c += 1) {
        if (r > c) continue;
        const [x, y] = triXY(r, c);
        vertexList.push([x, y]);
      }

    const graph = createGraphFromVertexList(vertexList, UNIT);
    graph.reorder();
    return graph;
  }
}

/**
 * HexagonOnTri — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/tri/HexagonOnTri.java
 *
 * Defines a hexagonal board on a triangular tiling using vertex-list approach.
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { createGraphFromVertexList, UNIT } from "../../../BaseGraphFunction.js";
import { Basis } from "../Basis.js";
import { triXY } from "./TriangleOnTri.js";

/** @java game/functions/graph/generators/basis/tri/HexagonOnTri.java */
export class HexagonOnTri extends Basis {
  /**
   * @java HexagonOnTri(DimFunction dim)
   * @param d Board dimension.
   */
  public constructor(d: number) {
    super();
    this._dim = [d];
  }

  /** @java HexagonOnTri.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const d0 = this._dim[0] ?? 1;
    // @java HexagonOnTri.eval:50
    const d = d0 + (siteType === "Cell" ? 1 : 0);
    const rows = 2 * d - 1;
    const cols = 2 * d - 1;

    // @java lines 68-77 — hex clip, vertex approach using Tri.xy
    const vertexList: [number, number][] = [];
    for (let row = 0; row < rows; row += 1)
      for (let col = 0; col < cols; col += 1) {
        if (col > cols / 2 + row || row - col > cols / 2) continue;
        const [x, y] = triXY(row, col);
        vertexList.push([x, y]);
      }

    const graph = createGraphFromVertexList(vertexList, UNIT);
    graph.makeFaces();
    graph.reorder();
    return graph;
  }
}

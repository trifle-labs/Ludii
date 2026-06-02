/**
 * RectangleOnTri — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/tri/RectangleOnTri.java
 *
 * Defines a rectangular (staggered) board on a triangular tiling.
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { createGraphFromVertexList, UNIT } from "../../../BaseGraphFunction.js";
import { Basis } from "../Basis.js";
import { triXY } from "./TriangleOnTri.js";

/** @java game/functions/graph/generators/basis/tri/RectangleOnTri.java */
export class RectangleOnTri extends Basis {
  /**
   * @java RectangleOnTri(DimFunction dimA, DimFunction dimB)
   * @param rowsDim Row dimension.
   * @param colsDim Column dimension.
   */
  public constructor(rowsDim: number, colsDim: number) {
    super();
    this._dim = [rowsDim, colsDim];
  }

  /** @java RectangleOnTri.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    // @java RectangleOnTri.eval:61-62
    const rows = (this._dim[0] ?? 1) + (siteType === "Cell" ? 1 : 0);
    const cols = (this._dim[1] ?? 1) + (siteType === "Cell" ? 1 : 0);

    // @java lines 65-73 — staggered band
    const vertexList: [number, number][] = [];
    for (let r = 0; r < rows; r += 1)
      for (let c = 0; c < cols + rows; c += 1) {
        if (c < Math.floor((r + 1) / 2) || c >= cols + Math.floor(r / 2)) continue;
        const [x, y] = triXY(r, c);
        vertexList.push([x, y]);
      }

    const graph = createGraphFromVertexList(vertexList, UNIT);
    graph.reorder();
    return graph;
  }
}

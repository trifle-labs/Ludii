/**
 * RectangleOnHex — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/hex/RectangleOnHex.java
 *
 * Defines a rectangular (staggered-column) board on a hexagonal tiling.
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { createGraphFromVertexList, UNIT } from "../../../BaseGraphFunction.js";
import { Basis } from "../Basis.js";
import { hexXY, HEX_REF } from "./HexagonOnHex.js";

/** @java game/functions/graph/generators/basis/hex/RectangleOnHex.java */
export class RectangleOnHex extends Basis {
  /**
   * @java RectangleOnHex(DimFunction dimA, DimFunction dimB)
   * @param rows Number of rows.
   * @param cols Number of columns.
   */
  public constructor(rows: number, cols: number) {
    super();
    this._dim = [rows, cols];
  }

  /** @java RectangleOnHex.eval(Context, SiteType) */
  public override eval(_siteType: string): Graph {
    const rows = this._dim[0] ?? 1;
    const cols = this._dim[1] ?? 1;

    // @java RectangleOnHex.eval:63-92 — staggered column band
    const vertexList: [number, number][] = [];
    for (let r = 0; r < rows; r += 1)
      for (let c = 0; c < cols + rows; c += 1) {
        if (c < Math.floor((r + 1) / 2) || c >= cols + Math.floor(r / 2)) continue;
        const [px, py] = hexXY(r, c);
        for (const [dx, dy] of HEX_REF) vertexList.push([px + dx, py + dy]);
      }

    const graph = createGraphFromVertexList(vertexList, UNIT);
    graph.reorder();
    return graph;
  }
}

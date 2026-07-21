/**
 * TriangleOnHex — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/hex/TriangleOnHex.java
 *
 * Defines a triangle-shaped board on a hexagonal tiling (r <= c clip).
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { createGraphFromVertexList, UNIT } from "../../../BaseGraphFunction.js";
import { Basis } from "../Basis.js";
import { hexXY, HEX_REF } from "./HexagonOnHex.js";

/** @java game/functions/graph/generators/basis/hex/TriangleOnHex.java */
export class TriangleOnHex extends Basis {
  /**
   * @java TriangleOnHex(DimFunction dim)
   * @param d Board dimension.
   */
  public constructor(d: number) {
    super();
    this._dim = [d];
  }

  /** @java TriangleOnHex.eval(Context, SiteType) */
  public override eval(_siteType: string): Graph {
    const d = this._dim[0] ?? 1;
    const rows = d;
    const cols = d;

    // @java TriangleOnHex.eval:55-82 — triangle clip r > c
    const vertexList: [number, number][] = [];
    for (let r = 0; r < rows; r += 1)
      for (let c = 0; c < cols; c += 1) {
        if (r > c) continue;
        const [px, py] = hexXY(r, c);
        for (const [dx, dy] of HEX_REF) vertexList.push([px + dx, py + dy]);
      }

    const graph = createGraphFromVertexList(vertexList, UNIT);
    graph.reorder();
    return graph;
  }
}

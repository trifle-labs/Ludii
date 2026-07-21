/**
 * DiamondOnSquare — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/square/DiamondOnSquare.java
 *
 * Defines a diamond-shaped board on a square tiling.
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { createGraphFromVertexList, UNIT } from "../../../BaseGraphFunction.js";
import { Basis } from "../Basis.js";
import { handleDiagonals } from "./RectangleOnSquare.js";
import type { DiagonalsType } from "./DiagonalsType.js";

/** @java game/functions/graph/generators/basis/square/DiamondOnSquare.java */
export class DiamondOnSquare extends Basis {
  private readonly diagonals: DiagonalsType | null;

  /**
   * @java DiamondOnSquare(DimFunction dim, DiagonalsType diagonals)
   * @param dim       Board dimension.
   * @param diagonals Diagonal edge style, or null.
   */
  public constructor(dim: number, diagonals: DiagonalsType | null = null) {
    super();
    this._dim = [dim];
    this.diagonals = diagonals;
  }

  /** @java DiamondOnSquare.eval(Context, SiteType) */
  public override eval(_siteType: string): Graph {
    // @java DiamondOnSquare.eval:63 — always use dim as is (no Cell/Vertex offset)
    const d = this._dim[0] ?? 1;
    const rows = 2 * d;
    const cols = 2 * d;

    // Create vertices — diamond clip: @java lines 68-76
    const vertexList: [number, number][] = [];
    for (let r = 0; r < rows; r += 1)
      for (let c = 0; c < cols; c += 1) {
        if (r + c < d - 1 || c - r > d || r - c > d || r + c >= 3 * d) continue;
        vertexList.push([c, r]);
      }

    const graph = createGraphFromVertexList(vertexList, UNIT);

    // @java line 80
    if (this.diagonals !== null) {
      handleDiagonals(graph, 0, rows, 0, cols, this.diagonals);
    }

    graph.makeFaces();
    graph.reorder();

    return graph;
  }
}

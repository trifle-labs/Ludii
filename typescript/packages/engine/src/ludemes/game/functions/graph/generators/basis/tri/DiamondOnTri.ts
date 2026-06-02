/**
 * DiamondOnTri — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/tri/DiamondOnTri.java
 *
 * Defines a diamond or prism board on the triangular tiling.
 * Uses a transposed xy mapping: (hy*(col-row), (row+col)*0.5).
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { createGraphFromVertexList, UNIT } from "../../../BaseGraphFunction.js";
import { Basis } from "../Basis.js";

/** @java DiamondOnTri.xy(row, col) */
function diamondTriXY(row: number, col: number): [number, number] {
  const hy = Math.sqrt(3) / 2.0;
  return [hy * (col - row), (row + col) * 0.5];
}

/** @java game/functions/graph/generators/basis/tri/DiamondOnTri.java */
export class DiamondOnTri extends Basis {
  private readonly isPrism: boolean;

  /**
   * @java DiamondOnTri(DimFunction dimA, DimFunction dimB)
   * @param dimA Primary dimension.
   * @param dimB Secondary dimension (null = Diamond, set = Prism).
   */
  public constructor(dimA: number, dimB: number | null = null) {
    super();
    this.isPrism = dimB !== null;
    this._dim = dimB !== null ? [dimA, dimB] : [dimA];
  }

  /** @java DiamondOnTri.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const isPrism = this.isPrism;
    const cell = siteType === "Cell" ? 1 : 0;
    // @java DiamondOnTri.eval:63-64
    const rows = (this._dim[0] ?? 1) + cell;
    const cols = (isPrism ? (this._dim[1] ?? this._dim[0] ?? 1) : (this._dim[0] ?? 1)) + cell;

    const vertexList: [number, number][] = [];
    if (isPrism) {
      // @java lines 70-80
      const span = rows + cols - 1;
      for (let r = 0; r < span; r += 1)
        for (let c = 0; c < span; c += 1) {
          if (Math.abs(r - c) >= rows) continue;
          const [x, y] = diamondTriXY(r, c);
          vertexList.push([x, y]);
        }
    } else {
      // @java lines 82-88
      for (let r = 0; r < rows; r += 1)
        for (let c = 0; c < cols; c += 1) {
          const [x, y] = diamondTriXY(r, c);
          vertexList.push([x, y]);
        }
    }

    const graph = createGraphFromVertexList(vertexList, UNIT);
    graph.reorder();
    return graph;
  }
}

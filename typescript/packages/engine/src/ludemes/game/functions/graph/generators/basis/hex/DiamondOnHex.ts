/**
 * DiamondOnHex — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/hex/DiamondOnHex.java
 *
 * Defines a diamond (rhombus) or prism board on the hex tiling.
 * Uses the transposed xy mapping and swapped ref components (ref[n][1], ref[n][0]).
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { createGraphFromVertexList, UNIT } from "../../../BaseGraphFunction.js";
import { Basis } from "../Basis.js";
import { HEX_REF } from "./HexagonOnHex.js";

/** @java DiamondOnHex.xy(row, col) — transposed hex placement */
function diamondXY(row: number, col: number): [number, number] {
  const hx = Math.sqrt(3); // @java unit * Math.sqrt(3)
  const hy = 3 / 2;        // @java unit * 3 / 2
  return [hy * (col - row), hx * (row + col) * 0.5];
}

/** @java game/functions/graph/generators/basis/hex/DiamondOnHex.java */
export class DiamondOnHex extends Basis {
  private readonly isPrism: boolean;

  /**
   * @java DiamondOnHex(DimFunction dimA, DimFunction dimB)
   * @param dimA Primary dimension.
   * @param dimB Secondary dimension (null for Diamond, set for Prism).
   */
  public constructor(dimA: number, dimB: number | null = null) {
    super();
    this.isPrism = dimB !== null;
    this._dim = dimB !== null ? [dimA, dimB] : [dimA];
  }

  /** @java DiamondOnHex.eval(Context, SiteType) */
  public override eval(_siteType: string): Graph {
    const isPrism = this.isPrism;
    const rows = this._dim[0] ?? 1;
    const cols = isPrism ? (this._dim[1] ?? rows) : rows;

    const maxRows = isPrism ? rows + cols - 1 : rows;
    const maxCols = isPrism ? rows + cols - 1 : cols;

    // @java DiamondOnHex.eval:74-100 — ref[n][1],ref[n][0] (swapped)
    const vertexList: [number, number][] = [];
    for (let row = 0; row < maxRows; row += 1)
      for (let col = 0; col < maxCols; col += 1) {
        if (isPrism && Math.abs(row - col) >= rows) continue;
        const [px, py] = diamondXY(row, col);
        for (const [dx, dy] of HEX_REF)
          vertexList.push([px + dy, py + dx]); // note: ref[n][1], ref[n][0]
      }

    const graph = createGraphFromVertexList(vertexList, UNIT);
    graph.reorder();
    return graph;
  }
}

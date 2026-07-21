/**
 * HexagonOnHex — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/hex/HexagonOnHex.java
 *
 * Defines a hexhex (regular hexagon) board on a hexagonal tiling.
 * Uses the vertex-collection + unit-distance edge join approach from
 * BaseGraphFunction.createGraphFromVertexList.
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { createGraphFromVertexList, UNIT } from "../../../BaseGraphFunction.js";
import { Basis } from "../Basis.js";

// @java Hex.ux, Hex.uy, Hex.ref
const UX = Math.sqrt(3) / 2;
const UY = 1.0;
const HEX_REF: readonly (readonly [number, number])[] = [
  [0.0 * UX,  1.0 * UY],
  [1.0 * UX,  0.5 * UY],
  [1.0 * UX, -0.5 * UY],
  [0.0 * UX, -1.0 * UY],
  [-1.0 * UX, -0.5 * UY],
  [-1.0 * UX,  0.5 * UY],
];

/** @java Hex.xy(row, col) */
function hexXY(row: number, col: number): [number, number] {
  const hx = Math.sqrt(3);
  const hy = 3 / 2;
  return [hx * (col - 0.5 * row), hy * row];
}

/** @java game/functions/graph/generators/basis/hex/HexagonOnHex.java */
export class HexagonOnHex extends Basis {
  /**
   * @java HexagonOnHex(DimFunction dim)
   * @param d Board dimension (number of cells per side).
   */
  public constructor(d: number) {
    super();
    this._dim = [d];
  }

  /** @java HexagonOnHex.eval(Context, SiteType) */
  public override eval(_siteType: string): Graph {
    const d = this._dim[0] ?? 1;
    const rows = 2 * d - 1;
    const cols = 2 * d - 1;

    // Collect hex-corner vertices for all cells in the hexagonal clip
    // @java HexagonOnHex.eval:84-133 (simplified from the optimised version)
    const vertexList: [number, number][] = [];
    for (let row = 0; row < rows; row += 1)
      for (let col = 0; col < cols; col += 1) {
        if (col > cols / 2 + row || row - col > cols / 2) continue;
        const [px, py] = hexXY(row, col);
        for (const [dx, dy] of HEX_REF) vertexList.push([px + dx, py + dy]);
      }

    const graph = createGraphFromVertexList(vertexList, UNIT);
    graph.reorder();
    return graph;
  }
}

export { hexXY, HEX_REF };

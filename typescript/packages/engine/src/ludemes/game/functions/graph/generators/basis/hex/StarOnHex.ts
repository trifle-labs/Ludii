/**
 * StarOnHex — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/hex/StarOnHex.java
 *
 * Defines a six-pointed star board on the hexagonal tiling.
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { createGraphFromVertexList, UNIT } from "../../../BaseGraphFunction.js";
import { Basis } from "../Basis.js";
import { hexXY, HEX_REF } from "./HexagonOnHex.js";

/** @java game/functions/graph/generators/basis/hex/StarOnHex.java */
export class StarOnHex extends Basis {
  /**
   * @java StarOnHex(DimFunction dim)
   * @param d Board dimension (arm length of each star point).
   */
  public constructor(d: number) {
    super();
    this._dim = [d];
  }

  /** @java StarOnHex.eval(Context, SiteType) */
  public override eval(_siteType: string): Graph {
    const d = this._dim[0] ?? 1;
    const rows = 4 * d + 1;
    const cols = 4 * d + 1;

    // @java StarOnHex.eval:55-103 — six-pointed star clip
    const vertexList: [number, number][] = [];
    for (let r = 0; r < rows; r += 1)
      for (let c = 0; c < cols; c += 1) {
        if (r < d) {
          if (c < d || c - r > d) continue;
        } else if (r <= 2 * d) {
          if (r - c > d || c >= cols - d) continue;
        } else if (r <= 3 * d) {
          if (c < d || c - r > d) continue;
        } else {
          if (c > 3 * d || r - c > d) continue;
        }
        const [px, py] = hexXY(r, c);
        for (const [dx, dy] of HEX_REF) vertexList.push([px + dx, py + dy]);
      }

    const graph = createGraphFromVertexList(vertexList, UNIT);
    graph.reorder();
    return graph;
  }
}

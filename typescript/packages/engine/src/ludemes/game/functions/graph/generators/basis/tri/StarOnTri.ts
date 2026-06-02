/**
 * StarOnTri — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/tri/StarOnTri.java
 *
 * Defines a six-pointed star board on the triangular tiling.
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { createGraphFromVertexList, UNIT } from "../../../BaseGraphFunction.js";
import { Basis } from "../Basis.js";
import { triXY } from "./TriangleOnTri.js";

/** @java game/functions/graph/generators/basis/tri/StarOnTri.java */
export class StarOnTri extends Basis {
  /**
   * @java StarOnTri(DimFunction dim)
   * @param d Board dimension (arm length).
   */
  public constructor(d: number) {
    super();
    this._dim = [d];
  }

  /** @java StarOnTri.eval(Context, SiteType) */
  public override eval(_siteType: string): Graph {
    const d = this._dim[0] ?? 1;
    const rows = 4 * d + 1;
    const cols = 4 * d + 1;

    // @java StarOnTri.eval:53-87 — six-pointed star clip (identical to StarOnHex clip)
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
        const [x, y] = triXY(r, c);
        vertexList.push([x, y]);
      }

    const graph = createGraphFromVertexList(vertexList, UNIT);
    graph.reorder();
    return graph;
  }
}

/**
 * TriangleOn3464 — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/tiling/tiling3464/TriangleOn3464.java
 *
 * Triangle shaped board on the 3.4.6.4 tiling.
 */

import { Graph } from "../../../../../../../../eval/graph/graph.js";
import { createGraphFromVertexList } from "../../../../BaseGraphFunction.js";
import { Basis } from "../../Basis.js";

const UNIT = 1;
const SQRT3 = Math.sqrt(3);

/**
 * @java TriangleOn3464.ref — stored as [ref[n][0], ref[n][1]] matching Java.
 * Stamping uses: x += ref[n][1], y += ref[n][0].
 */
function buildRef(): [number, number][] {
  const ux = UNIT;
  const uy = UNIT * SQRT3 / 2;
  const out: [number, number][] = [
    [-0.5 * ux,  1.0 * uy],
    [ 0.5 * ux,  1.0 * uy],
    [ 1.0 * ux,  0.0 * uy],
    [ 0.5 * ux, -1.0 * uy],
    [-0.5 * ux, -1.0 * uy],
    [-1.0 * ux,  0.0 * uy],
  ];
  const a = UNIT + SQRT3 / 2;
  const h = a / Math.cos(15 * Math.PI / 180);
  for (let n = 0; n < 12; n++) {
    const theta = (15 + n * 30) * Math.PI / 180;
    out.push([h * Math.cos(theta), h * Math.sin(theta)]);
  }
  return out;
}
const REF = buildRef();

/** @java TriangleOn3464.xy — same staggered layout as RectangleOn3464 */
function xy(row: number, col: number): [number, number] {
  const hx = UNIT * (1 + SQRT3);
  const hy = UNIT * (3 + SQRT3) / 2;
  return [hx * (col - 0.5 * row), hy * row];
}

/** @java TriangleOn3464 — triangle shaped 3.4.6.4 board */
export class TriangleOn3464 extends Basis {
  public constructor(dim: number) {
    super();
    this._dim = [dim];
  }

  public override eval(_siteType: string): Graph {
    const rows = this._dim[0] ?? 1;
    const cols = rows;

    const vertexList: [number, number][] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // @java: if (r > c) continue; — lower-left triangle
        if (r > c) continue;

        const [px, py] = xy(r, c);

        for (const [r0, r1] of REF) {
          // @java: x = ptRef.getX() + ref[n][1]; y = ptRef.getY() + ref[n][0]
          const vx = px + r1;
          const vy = py + r0;

          let found = false;
          for (const [ex, ey] of vertexList) {
            if (Math.hypot(ex - vx, ey - vy) < 0.1) { found = true; break; }
          }
          if (!found) vertexList.push([vx, vy]);
        }
      }
    }

    const result = createGraphFromVertexList(vertexList, UNIT);
    result.reorder();
    return result;
  }
}

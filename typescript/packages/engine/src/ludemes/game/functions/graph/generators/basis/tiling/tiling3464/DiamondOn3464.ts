/**
 * DiamondOn3464 — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/tiling/tiling3464/DiamondOn3464.java
 *
 * Diamond (rhombus) or Prism shaped board on the 3.4.6.4 tiling.
 */

import { Graph } from "../../../../../../../../eval/graph/graph.js";
import { createGraphFromVertexList } from "../../../../BaseGraphFunction.js";
import { Basis } from "../../Basis.js";

const UNIT = 1;
const SQRT3 = Math.sqrt(3);

/**
 * @java DiamondOn3464.ref — stored as [ref[n][0], ref[n][1]] matching Java.
 * Stamping uses: x += ref[n][0], y += ref[n][1]  (different from RectangleOn3464).
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

/** @java DiamondOn3464.xy — diamond layout: x=hy*(col-row), y=hx*(row+col)*0.5 */
function xy(row: number, col: number): [number, number] {
  const hx = UNIT * (1 + SQRT3);
  const hy = UNIT * (3 + SQRT3) / 2;
  return [hy * (col - row), hx * (row + col) * 0.5];
}

/** @java DiamondOn3464 — diamond/prism shaped 3.4.6.4 board */
export class DiamondOn3464 extends Basis {
  /** @param dimA rows (diamond: also cols). @param dimB cols if prism shape. */
  public constructor(dimA: number, dimB?: number) {
    super();
    this._dim = dimB !== undefined ? [dimA, dimB] : [dimA];
  }

  public override eval(_siteType: string): Graph {
    const isPrism = this._dim.length >= 2;
    const rows = this._dim[0] ?? 1;
    const cols = isPrism ? (this._dim[1] ?? rows) : rows;

    const vertexList: [number, number][] = [];

    if (isPrism) {
      // @java: for r in 0..rows+cols-1, for c in 0..rows+cols-1: skip if |r-c| >= rows
      const span = rows + cols - 1;
      for (let r = 0; r < span; r++) {
        for (let c = 0; c < span; c++) {
          if (Math.abs(r - c) >= rows) continue;
          addVertex(r, c, vertexList);
        }
      }
    } else {
      // @java: full rows×cols lattice
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          addVertex(r, c, vertexList);
        }
      }
    }

    const result = createGraphFromVertexList(vertexList, UNIT);
    result.reorder();
    return result;
  }
}

function addVertex(row: number, col: number, vertexList: [number, number][]): void {
  const [px, py] = xy(row, col);

  for (const [r0, r1] of REF) {
    // @java DiamondOn3464.addVertex: x = ptRef.getX() + ref[n][0]; y = ptRef.getY() + ref[n][1]
    const vx = px + r0;
    const vy = py + r1;

    let found = false;
    for (const [ex, ey] of vertexList) {
      if (Math.hypot(ex - vx, ey - vy) < 0.1) { found = true; break; }
    }
    if (!found) vertexList.push([vx, vy]);
  }
}

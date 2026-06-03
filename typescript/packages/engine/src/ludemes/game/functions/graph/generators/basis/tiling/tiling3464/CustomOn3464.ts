/**
 * CustomOn3464 — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/tiling/tiling3464/CustomOn3464.java
 *
 * Custom polygon or side-described board on the 3.4.6.4 tiling.
 */

import { Graph } from "../../../../../../../../eval/graph/graph.js";
import { createGraphFromVertexList } from "../../../../BaseGraphFunction.js";
import { Basis } from "../../Basis.js";

const UNIT = 1;
const SQRT3 = Math.sqrt(3);

/**
 * @java CustomOn3464.ref — stored as [ref[n][0], ref[n][1]] matching Java.
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

/**
 * @java CustomOn3464.xy — cell-centre for stamping (rectangle layout).
 * x = hx*(col - 0.5*row), y = hy*row
 */
function cellXY(row: number, col: number): [number, number] {
  const hx = UNIT * (1 + SQRT3);
  const hy = UNIT * (3 + SQRT3) / 2;
  return [hx * (col - 0.5 * row), hy * row];
}

/**
 * @java Tiling3464.xy — used for polygon boundary vertices (diamond layout).
 * x = hx*(col - row), y = hy*(row+col)*0.5
 */
function polyXY(row: number, col: number): [number, number] {
  const hx = UNIT * (1 + SQRT3);
  const hy = UNIT * (3 + SQRT3) / 2;
  return [hx * (col - row), hy * (row + col) * 0.5];
}

/** @java main.math.Polygon.contains — even-odd ray cast */
function polygonContains(pts: [number, number][], px: number, py: number): boolean {
  let j = pts.length - 1;
  let odd = false;
  for (let i = 0; i < pts.length; i++) {
    const [ix, iy] = pts[i]!;
    const [jx, jy] = pts[j]!;
    if (((iy < py && jy >= py) || (jy < py && iy >= py)) && (ix <= px || jx <= px)) {
      if (ix + ((py - iy) / (jy - iy)) * (jx - ix) < px) odd = !odd;
    }
    j = i;
  }
  return odd;
}

/** @java main.math.Polygon.inflate — push each vertex outward along bisector */
function inflatePolygon(pts: [number, number][], amount: number): void {
  const m = pts.length;
  const norm = (vx: number, vy: number): [number, number] => {
    const len = Math.hypot(vx, vy);
    return len === 0 ? [0, 0] : [(vx / len) * amount, (vy / len) * amount];
  };
  const adj: [number, number][] = [];
  for (let i = 0; i < m; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % m]!;
    const c = pts[(i + 2) % m]!;
    const cross = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
    const cw = cross < 1e-7;
    const [ix, iy] = cw ? norm(b[0] - a[0], b[1] - a[1]) : norm(a[0] - b[0], a[1] - b[1]);
    const [ox, oy] = cw ? norm(b[0] - c[0], b[1] - c[1]) : norm(c[0] - b[0], c[1] - b[1]);
    adj.push([(ix + ox) * 0.5, (iy + oy) * 0.5]);
  }
  for (let i = 0; i < m; i++) {
    const a = adj[(i - 1 + m) % m]!;
    const p = pts[i]!;
    pts[i] = [p[0] + a[0], p[1] + a[1]];
  }
}

/**
 * @java CustomOn3464.polygonFromSides — walk boundary using Tiling3464.xy.
 * Uses `dirn` (same name as Java variable) turning left/right per side value.
 */
function polygonFromSides(sides: number[]): [number, number][] {
  const steps: [number, number][] = [
    [1, 0], [1, 1], [0, 1], [-1, 0], [-1, -1], [0, -1],
  ];

  let dirn = 1;
  let row = 0;
  let col = 0;

  const pts: [number, number][] = [polyXY(row, col)];

  const n = Math.max(5, sides.length);
  for (let i = 0; i < n; i++) {
    let nextStep = sides[i % sides.length] as number;

    // Always reduce by 1
    if (nextStep < 0) nextStep += 1;
    else nextStep -= 1;

    if (nextStep < 0) dirn -= 1;
    else dirn += 1;

    dirn = (dirn + 6) % 6;

    if (nextStep > 0) {
      row += nextStep * steps[dirn]![0];
      col += nextStep * steps[dirn]![1];
      pts.push(polyXY(row, col));
    }
  }
  return pts;
}

/** @java CustomOn3464 — custom polygon or side-described 3.4.6.4 board */
export class CustomOn3464 extends Basis {
  private readonly _polygon: [number, number][] | null;
  private readonly _sides: number[];

  /** Constructor for polygon-defined board */
  public constructor(polyOrSides: [number, number][] | number[], isPoly = false) {
    super();
    this._dim = [];
    if (isPoly) {
      this._polygon = polyOrSides as [number, number][];
      this._sides = [];
    } else {
      this._polygon = null;
      this._sides = polyOrSides as number[];
    }
  }

  public override eval(_siteType: string): Graph {
    // Build polygon from sides if needed
    let poly: [number, number][];
    if (this._polygon !== null && this._polygon.length > 0) {
      poly = this._polygon.map(p => [p[0], p[1]] as [number, number]);
    } else {
      poly = polygonFromSides(this._sides);
    }

    inflatePolygon(poly, 0.1);

    // Compute bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [px, py] of poly) {
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }

    const fromCol = Math.trunc(minX) - 2;
    const fromRow = Math.trunc(minY) - 2;
    const toCol = Math.trunc(maxX) + 2;
    const toRow = Math.trunc(maxY) + 2;

    const vertexList: [number, number][] = [];

    for (let r = fromRow; r <= toRow; r++) {
      for (let c = fromCol; c <= toCol; c++) {
        // @java eval uses custom xy (rectangle layout) for cell centres
        const [px, py] = cellXY(r, c);

        if (!polygonContains(poly, px, py)) continue;

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

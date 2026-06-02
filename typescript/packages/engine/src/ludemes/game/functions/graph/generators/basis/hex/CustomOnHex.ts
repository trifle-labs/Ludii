/**
 * CustomOnHex — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/hex/CustomOnHex.java
 *
 * Custom polygon or side-described board on the hex tiling.
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import { createGraphFromVertexList, UNIT } from "../../../BaseGraphFunction.js";
import { Basis } from "../Basis.js";
import { hexXY, HEX_REF } from "./HexagonOnHex.js";

/** @java CustomOnHex.polygonFromSides — walk the boundary using hex steps */
function polygonFromSides(sides: readonly number[]): [number, number][] {
  const steps = [[1, 0], [1, 1], [0, 1], [-1, 0], [-1, -1], [0, -1]] as const;
  let step = 1;
  let row = 0;
  let col = 0;
  const poly: [number, number][] = [hexXY(row, col)];
  const n = Math.max(5, sides.length);
  for (let i = 0; i < n; i += 1) {
    let nextStep = sides[i % sides.length] as number;
    if (nextStep < 0) nextStep += 1; else nextStep -= 1;
    if (nextStep < 0) step -= 1; else step += 1;
    step = (step + 6) % 6;
    if (nextStep > 0) {
      const s = steps[step]!;
      row += nextStep * s[0];
      col += nextStep * s[1];
      poly.push(hexXY(row, col));
    }
  }
  return poly;
}

/** Even-odd ray-cast. */
function polygonContains(poly: readonly [number, number][], x: number, y: number): boolean {
  let j = poly.length - 1;
  let odd = false;
  for (let i = 0; i < poly.length; i += 1) {
    const [ix, iy] = poly[i]!;
    const [jx, jy] = poly[j]!;
    if (((iy < y && jy >= y) || (jy < y && iy >= y)) && (ix <= x || jx <= x))
      if (ix + ((y - iy) / (jy - iy)) * (jx - ix) < x) odd = !odd;
    j = i;
  }
  return odd;
}

/** Push each vertex outward along bisector by `amount`. */
function inflatePolygon(pts: [number, number][], amount: number): void {
  const m = pts.length;
  if (m < 3) return;
  const adj: [number, number][] = [];
  const norm = (vx: number, vy: number): [number, number] => {
    const len = Math.hypot(vx, vy);
    return len === 0 ? [0, 0] : [(vx / len) * amount, (vy / len) * amount];
  };
  for (let i = 0; i < m; i += 1) {
    const a = pts[i]!;
    const b = pts[(i + 1) % m]!;
    const c = pts[(i + 2) % m]!;
    const cross = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
    const cw = cross < 1e-7;
    const [ix, iy] = cw ? norm(b[0] - a[0], b[1] - a[1]) : norm(a[0] - b[0], a[1] - b[1]);
    const [ox, oy] = cw ? norm(b[0] - c[0], b[1] - c[1]) : norm(c[0] - b[0], c[1] - b[1]);
    adj.push([(ix + ox) * 0.5, (iy + oy) * 0.5]);
  }
  for (let i = 0; i < m; i += 1) {
    const a = adj[(i - 1 + m) % m]!;
    const p = pts[i]!;
    pts[i] = [p[0] + a[0], p[1] + a[1]];
  }
}

/** @java game/functions/graph/generators/basis/hex/CustomOnHex.java */
export class CustomOnHex extends Basis {
  private readonly polyPts: [number, number][] | null;
  private readonly sides: number[] | null;

  /** @java CustomOnHex(Polygon polygon) */
  public constructor(polyOrSides: [number, number][] | number[], isPoly = false) {
    super();
    this._dim = [];
    if (isPoly) {
      this.polyPts = polyOrSides as [number, number][];
      this.sides = null;
    } else {
      this.polyPts = null;
      this.sides = polyOrSides as number[];
    }
  }

  /** @java CustomOnHex.eval(Context, SiteType) */
  public override eval(_siteType: string): Graph {
    // @java CustomOnHex.eval:80-139
    let polygon: [number, number][] = this.polyPts ? [...this.polyPts] : [];
    if (polygon.length === 0 && this.sides && this.sides.length > 0)
      polygon = polygonFromSides(this.sides);

    inflatePolygon(polygon, 0.1);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [px, py] of polygon) {
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }
    const fromCol = Math.trunc(minX) - 3;
    const fromRow = Math.trunc(minY) - 3;
    const toCol   = Math.trunc(maxX) + 3;
    const toRow   = Math.trunc(maxY) + 3;

    const vertexList: [number, number][] = [];
    for (let r = fromRow; r <= toRow; r += 1)
      for (let c = fromCol; c <= toCol; c += 1) {
        const [px, py] = hexXY(r, c);
        if (!polygonContains(polygon, px, py)) continue;
        for (const [dx, dy] of HEX_REF) vertexList.push([px + dx, py + dy]);
      }

    const graph = createGraphFromVertexList(vertexList, UNIT);
    graph.reorder();
    return graph;
  }
}

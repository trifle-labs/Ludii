/**
 * CustomOn3636 — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/tiling/tiling3636/CustomOn3636.java
 *
 * Custom polygon or side-described board on the 3.6.3.6 tiling.
 */

import { Graph } from "../../../../../../../../eval/graph/graph.js";
import type { DimFunction } from "../../../../../dim/DimFunction.js";
import { Polygon } from "../../../../../../util/graph/Poly.js";
import { createGraphFromVertexList } from "../../../../BaseGraphFunction.js";
import { Basis } from "../../Basis.js";

const UNIT = 1;
const SQRT3 = Math.sqrt(3);

type PointTuple = readonly [number, number];
type PointTupleArray = ReadonlyArray<PointTuple>;
type SideArg = DimFunction | number;

/**
 * @java Tiling3636.ref — 6 hexagon corners stored as [ref[n][0], ref[n][1]].
 * ux = unit*sqrt(3)/2, uy = unit.
 * Stamping uses: x += ref[n][1], y += ref[n][0].
 */
const T3636_UX = UNIT * SQRT3 / 2;
const T3636_UY = UNIT;
const T3636_REF: [number, number][] = [
  [ 0.0 * T3636_UX,  1.0 * T3636_UY],
  [ 1.0 * T3636_UX,  0.5 * T3636_UY],
  [ 1.0 * T3636_UX, -0.5 * T3636_UY],
  [ 0.0 * T3636_UX, -1.0 * T3636_UY],
  [-1.0 * T3636_UX, -0.5 * T3636_UY],
  [-1.0 * T3636_UX,  0.5 * T3636_UY],
];

/**
 * @java Tiling3636.xy — cell centre:
 * x = hx*(col - 0.5*row),  y = hy*row   where hx=2, hy=sqrt(3)
 */
function t3636xy(row: number, col: number): [number, number] {
  const hx = 2;
  const hy = SQRT3;
  return [hx * (col - 0.5 * row), hy * row];
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
 * @java CustomOn3636.polygonFromSides — walk boundary using Tiling3636.xy.
 * Uses 6-directional steps and `step` variable.
 */
function polygonFromSides(sides: number[]): [number, number][] {
  const steps: [number, number][] = [
    [1, 0], [1, 1], [0, 1], [-1, 0], [-1, -1], [0, -1],
  ];

  let step = 1;
  let row = 0;
  let col = 0;

  const pts: [number, number][] = [t3636xy(row, col)];

  const n = Math.max(5, sides.length);
  for (let i = 0; i < n; i++) {
    let nextStep = sides[i % sides.length] as number;

    if (nextStep < 0) nextStep += 1;
    else nextStep -= 1;

    if (nextStep < 0) step -= 1;
    else step += 1;

    step = (step + 6) % 6;

    if (nextStep > 0) {
      row += nextStep * steps[step]![0];
      col += nextStep * steps[step]![1];
      pts.push(t3636xy(row, col));
    }
  }
  return pts;
}

/** @java CustomOn3636 — custom polygon or side-described 3.6.3.6 board */
export class CustomOn3636 extends Basis {
  private readonly _polygon: [number, number][] | null;
  private readonly _sides: number[];

  /** @java CustomOn3636(Polygon polygon) */
  public constructor(polygon: Polygon);
  /** @java CustomOn3636(DimFunction[] sides) */
  public constructor(sides: ReadonlyArray<DimFunction>);
  public constructor(polyOrSides: Polygon | PointTupleArray | ReadonlyArray<SideArg>) {
    super();
    this._dim = [];
    if (polyOrSides instanceof Polygon) {
      this._polygon = polyOrSides.points().map((pt) => [pt.x, pt.y]);
      this._sides = [];
    } else if (isPointTupleArray(polyOrSides)) {
      this._polygon = polyOrSides.map((pt) => [pt[0], pt[1]]);
      this._sides = [];
    } else {
      this._polygon = null;
      this._sides = polyOrSides.map(evalSide);
    }
  }

  public override eval(_siteType: string): Graph {
    let poly: [number, number][];
    if (this._polygon !== null && this._polygon.length > 0) {
      poly = this._polygon.map(p => [p[0], p[1]] as [number, number]);
    } else {
      poly = polygonFromSides(this._sides);
    }

    inflatePolygon(poly, 0.1);

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
        const [px, py] = t3636xy(r, c);

        if (!polygonContains(poly, px, py)) continue;

        for (const [r0, r1] of T3636_REF) {
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

function isPointTupleArray(value: ReadonlyArray<unknown>): value is PointTupleArray {
  return value.length > 0 && value.every((point) =>
    Array.isArray(point) && point.length === 2 && point.every((coord) => typeof coord === "number"));
}

function evalSide(side: SideArg): number {
  return typeof side === "number" ? side : side.eval();
}

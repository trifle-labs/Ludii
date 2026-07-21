/**
 * CustomOn488 — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/tiling/tiling488/CustomOn488.java
 *
 * Custom polygon or side-described board on the 4.8.8 tiling.
 */

import { Graph } from "../../../../../../../../eval/graph/graph.js";
import type { DimFunction } from "../../../../../dim/DimFunction.js";
import { Polygon } from "../../../../../../util/graph/Poly.js";
import { createGraphFromVertexList } from "../../../../BaseGraphFunction.js";
import { Basis } from "../../Basis.js";

const UNIT = 1;

type PointTuple = readonly [number, number];
type PointTupleArray = ReadonlyArray<PointTuple>;
type SideArg = DimFunction | number;

/** @java Tiling488 — v = unit * (1 + 2/sqrt(2)) */
const V = UNIT * (1 + 2 / Math.sqrt(2));

/**
 * @java Tiling488.ref — 8 octagon corners stored as [x, y].
 * Stamping uses: x += ref[n][0], y += ref[n][1].
 */
const T488_REF: [number, number][] = [
  [ UNIT / 2,  V    / 2],
  [ V    / 2,  UNIT / 2],
  [ V    / 2, -UNIT / 2],
  [ UNIT / 2, -V    / 2],
  [-UNIT / 2, -V    / 2],
  [-V    / 2, -UNIT / 2],
  [-V    / 2,  UNIT / 2],
  [-UNIT / 2,  V    / 2],
];

/** @java Tiling488.xy — cell centre: x = col*v, y = row*v */
function t488xy(row: number, col: number): [number, number] {
  return [col * V, row * V];
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
 * @java main.math.Polygon.fromSides(TIntArrayList sides, int[][] steps)
 * steps = {{0,1},{1,0},{0,-1},{-1,0}} (4-directional grid steps)
 * Starts with step = steps.length - 1 = 3. Points are (col, row).
 */
function fromSides488(sides: number[]): [number, number][] {
  const steps: [number, number][] = [
    [0, 1], [1, 0], [0, -1], [-1, 0],
  ];
  let step = steps.length - 1; // = 3
  let row = 0;
  let col = 0;

  const pts: [number, number][] = [[col, row]];

  for (let n = 0; n < sides.length; n++) {
    const nextStep = sides[n] as number;
    step = (step + (nextStep < 0 ? -1 : 1) + steps.length) % steps.length;
    row += nextStep * steps[step]![0];
    col += nextStep * steps[step]![1];
    pts.push([col, row]);
  }
  return pts;
}

/** @java CustomOn488 — custom polygon or side-described 4.8.8 board */
export class CustomOn488 extends Basis {
  private readonly _polygon: [number, number][] | null;
  private readonly _sides: number[];

  /** @java CustomOn488(Polygon polygon) */
  public constructor(polygon: Polygon);
  /** @java CustomOn488(DimFunction[] sides) */
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
      poly = fromSides488(this._sides);
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
        const [px, py] = t488xy(r, c);

        if (!polygonContains(poly, px, py)) continue;

        for (const [r0, r1] of T488_REF) {
          // @java: x = ptRef.getX() + ref[n][0]; y = ptRef.getY() + ref[n][1]
          const vx = px + r0;
          const vy = py + r1;

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

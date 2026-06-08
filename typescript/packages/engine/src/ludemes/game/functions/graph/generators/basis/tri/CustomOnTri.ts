/**
 * CustomOnTri — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/tri/CustomOnTri.java
 *
 * Custom polygon or side-described board on the triangular tiling.
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import type { DimFunction } from "../../../../dim/DimFunction.js";
import { Polygon } from "../../../../../util/graph/Poly.js";
import { createGraphFromVertexList, UNIT } from "../../../BaseGraphFunction.js";
import { Basis } from "../Basis.js";
import { triXY } from "./TriangleOnTri.js";

type PointTuple = readonly [number, number];
type PointTupleArray = ReadonlyArray<PointTuple>;
type SideArg = DimFunction | number;

/** @java CustomOnTri.polygonFromSides */
function polygonFromSides(sides: readonly number[]): [number, number][] {
  const steps = [[1, 0], [1, 1], [0, 1], [-1, 0], [-1, -1], [0, -1]] as const;
  let dirn = 1;
  let row = 0;
  let col = 0;
  const poly: [number, number][] = [triXY(row, col)];
  const n = Math.max(5, sides.length);
  for (let i = 0; i < n; i += 1) {
    let nextStep = sides[i % sides.length] as number;
    if (nextStep < 0) nextStep += 1; else nextStep -= 1;
    if (nextStep < 0) dirn -= 1; else dirn += 1;
    dirn = (dirn + 6) % 6;
    if (nextStep > 0) {
      const s = steps[dirn]!;
      row += nextStep * s[0];
      col += nextStep * s[1];
      poly.push(triXY(row, col));
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

/** Inflate polygon outward by `amount`. */
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

/** @java game/functions/graph/generators/basis/tri/CustomOnTri.java */
export class CustomOnTri extends Basis {
  private readonly polyPts: [number, number][] | null;
  private readonly sides: number[] | null;

  /** @java CustomOnTri(Polygon polygon) */
  public constructor(polygon: Polygon);
  /** @java CustomOnTri(DimFunction[] sides) */
  public constructor(sides: ReadonlyArray<DimFunction>);
  public constructor(polyOrSides: Polygon | PointTupleArray | ReadonlyArray<SideArg>) {
    super();
    this._dim = [];
    if (polyOrSides instanceof Polygon) {
      this.polyPts = polyOrSides.points().map((pt) => [pt.x, pt.y]);
      this.sides = null;
    } else if (isPointTupleArray(polyOrSides)) {
      this.polyPts = polyOrSides.map((pt) => [pt[0], pt[1]]);
      this.sides = null;
    } else {
      this.polyPts = null;
      this.sides = polyOrSides.map(evalSide);
    }
  }

  /** @java CustomOnTri.eval(Context, SiteType) */
  public override eval(_siteType: string): Graph {
    // @java CustomOnTri.eval:79-112
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
    // @java margin = (shape == Limping && sides) ? sides.get(0) : 2
    const margin = this.sides ? Math.max(0, Math.trunc(this.sides[0] ?? 2)) : 2;
    const fromCol = Math.trunc(minX) - margin;
    const fromRow = Math.trunc(minY) - margin;
    const toCol   = Math.trunc(maxX) + margin;
    const toRow   = Math.trunc(maxY) + margin;

    const vertexList: [number, number][] = [];
    for (let r = fromRow; r <= toRow; r += 1)
      for (let c = fromCol; c <= toCol; c += 1) {
        const [x, y] = triXY(r, c);
        if (polygonContains(polygon, x, y)) vertexList.push([x, y]);
      }

    const graph = createGraphFromVertexList(vertexList, UNIT);
    graph.reorder();
    return graph;
  }
}

function isPointTupleArray(value: ReadonlyArray<unknown>): value is PointTupleArray {
  return value.length > 0 && value.every((point) =>
    Array.isArray(point) && point.length === 2 && point.every((coord) => typeof coord === "number"));
}

function evalSide(side: SideArg): number {
  return typeof side === "number" ? side : side.eval();
}

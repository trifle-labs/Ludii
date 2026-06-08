/**
 * CustomOnSquare — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/square/CustomOnSquare.java
 *
 * Defines a custom-polygon board on the square tiling (sides or explicit poly).
 * Faithful port: builds polygon from sides using Square.steps walk, inflates by
 * 0.1, keeps grid vertices inside, joins unit-apart pairs.
 */

import { Graph } from "../../../../../../../eval/graph/graph.js";
import type { DimFunction } from "../../../../dim/DimFunction.js";
import { Polygon } from "../../../../../util/graph/Poly.js";
import { createGraphFromVertexList, UNIT } from "../../../BaseGraphFunction.js";
import { Basis } from "../Basis.js";
import { handleDiagonals } from "./RectangleOnSquare.js";
import type { DiagonalsType } from "./DiagonalsType.js";

// @java Square.steps — all four orthogonal directions
const SQUARE_STEPS = [[1, 0], [0, 1], [-1, 0], [0, -1]] as const;

type PointTuple = readonly [number, number];
type PointTupleArray = ReadonlyArray<PointTuple>;
type SideArg = DimFunction | number;

/** @java game/functions/graph/generators/basis/square/CustomOnSquare.java */
export class CustomOnSquare extends Basis {
  private readonly poly: [number, number][] | null;
  private readonly sides: number[] | null;
  private readonly diagonals: DiagonalsType | null;

  /** @java CustomOnSquare(Polygon polygon, DiagonalsType diagonals) */
  /** @java CustomOnSquare(DimFunction[] sides, DiagonalsType diagonals) */
  public constructor(
    polyOrSides: Polygon | PointTupleArray | ReadonlyArray<SideArg>,
    diagonals: DiagonalsType | null,
  ) {
    super();
    this._dim = [];
    this.diagonals = diagonals;
    if (polyOrSides instanceof Polygon) {
      this.poly = polyOrSides.points().map((pt) => [pt.x, pt.y]);
      this.sides = null;
    } else if (isPointTupleArray(polyOrSides)) {
      this.poly = polyOrSides.map((pt) => [pt[0], pt[1]]);
      this.sides = null;
    } else {
      this.poly = null;
      this.sides = polyOrSides.map(evalSide);
    }
  }

  /** @java CustomOnSquare.eval(Context, SiteType) */
  public override eval(_siteType: string): Graph {
    // Build polygon from sides if needed @java line 88-89
    let polygon: [number, number][] = this.poly ? [...this.poly] : [];
    if (polygon.length === 0 && this.sides && this.sides.length > 0) {
      polygon = polygonFromSides(this.sides);
    }

    // Inflate @java line 91
    inflatePolygon(polygon, 0.1);

    // Bounds @java lines 93-99
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [px, py] of polygon) {
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }
    const fromCol = Math.trunc(minX) - 2;
    const fromRow = Math.trunc(minY) - 2;
    const toCol   = Math.trunc(maxX) + 2;
    const toRow   = Math.trunc(maxY) + 2;

    // Collect vertices inside polygon @java lines 102-111
    const vertexList: [number, number][] = [];
    for (let row = fromRow; row <= toRow; row += 1)
      for (let col = fromCol; col <= toCol; col += 1)
        if (polygonContains(polygon, col, row))
          vertexList.push([col, row]);

    const graph = createGraphFromVertexList(vertexList, UNIT);

    // Diagonals @java line 113
    if (this.diagonals !== null) {
      handleDiagonals(graph, fromRow, toRow, fromCol, toCol, this.diagonals);
    }

    graph.makeFaces();
    graph.reorder();

    return graph;
  }
}

/**
 * @java CustomOnSquare.polygonFromSides / Polygon.fromSides(sides, Square.steps)
 * Walk boundary using Square.steps offsets.
 */
function polygonFromSides(sides: readonly number[]): [number, number][] {
  let step = 1;
  let row = 0;
  let col = 0;
  const poly: [number, number][] = [[col, row]];
  const n = Math.max(5, sides.length);
  for (let i = 0; i < n; i += 1) {
    let nextStep = sides[i % sides.length] as number;
    if (nextStep < 0) nextStep += 1; else nextStep -= 1;
    if (nextStep < 0) step -= 1; else step += 1;
    step = (step + 4) % 4;
    if (nextStep > 0) {
      const s = SQUARE_STEPS[step]!;
      row += nextStep * s[0];
      col += nextStep * s[1];
      poly.push([col, row]);
    }
  }
  return poly;
}

/** Even-odd ray-cast point-in-polygon. */
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

function isPointTupleArray(value: ReadonlyArray<unknown>): value is PointTupleArray {
  return value.length > 0 && value.every((point) =>
    Array.isArray(point) && point.length === 2 && point.every((coord) => typeof coord === "number"));
}

function evalSide(side: SideArg): number {
  return typeof side === "number" ? side : side.eval();
}

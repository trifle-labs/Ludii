/**
 * Named Archimedean (semi-regular) tiling generators — Java parity with
 * Core/src/game/functions/graph/generators/basis/tiling/**.
 *
 * Each tiling lays a fixed set of polygon-corner offsets (`ref`) around every
 * cell of an integer (row, col) lattice mapped to the plane by `xy`, dedups
 * coincident corners, then joins every pair of vertices exactly one unit apart
 * (Java: `BaseGraphFunction.createGraphFromVertexList`, unit = 1). The bounded
 * faces are the play cells.
 *
 * `(tiling T3464 n)` / `(tiling T33434 n)` etc. The dimension `dimA` (and
 * optional `dimB`) controls board extent and, for the hex-shaped tilings, the
 * hexagonal clip.
 */

import { Graph } from "./graph.js";

const SQRT3 = Math.sqrt(3);
/** Vertex coincidence tolerance used while collecting tiling corners (Java: 0.1). */
const DEDUP = 0.1;
/** Edge length: corners exactly this far apart are joined (Java: unit = 1). */
const UNIT = 1;

type XY = (row: number, col: number) => [number, number];
type Keep = (row: number, col: number, rows: number, cols: number) => boolean;

interface TilingSpec {
  /** Polygon-corner offsets, already resolved to (dx, dy) about a cell. */
  readonly ref: readonly (readonly [number, number])[];
  readonly xy: XY;
  readonly rows: number;
  readonly cols: number;
  readonly keep?: Keep;
}

/** Collect offset corners over the lattice, then join unit-apart pairs. */
function buildTiling(spec: TilingSpec): Graph {
  const g = new Graph();
  for (let row = 0; row < spec.rows; row += 1) {
    for (let col = 0; col < spec.cols; col += 1) {
      if (spec.keep && !spec.keep(row, col, spec.rows, spec.cols)) continue;
      const [px, py] = spec.xy(row, col);
      for (const [dx, dy] of spec.ref) g.addVertex(px + dx, py + dy, DEDUP);
    }
  }
  const vs = g.vertices;
  for (let a = 0; a < vs.length; a += 1) {
    const va = vs[a]!;
    for (let b = a + 1; b < vs.length; b += 1) {
      const vb = vs[b]!;
      const d = Math.hypot(va.x - vb.x, va.y - vb.y);
      if (Math.abs(d - UNIT) < 0.01) g.addEdge(a, b);
    }
  }
  g.makeFaces();
  // Java parity: Tiling generators canonicalise indices via graph.reorder()
  // after building faces, so site numbering matches Java. Without it, hex/tri
  // shape clips and (remove … cells:{…}) hit the wrong sites.
  g.reorder();
  return g;
}

/** Hexagon clip used by 3464 / 3636: keep a rhombus-cornered hexagon. */
const hexClipDiff: Keep = (row, col, _rows, cols) =>
  !(col > Math.floor(cols / 2) + row || row - col > Math.floor(cols / 2));

/** Hexagon clip used by 31212 / 33336 / 4612 / 333333_33434. */
const hexClipAbs: Keep = (row, col, rows) =>
  Math.abs(row - col) <= Math.floor(rows / 2);

/** Twelve evenly-spaced unit-circle corners (dodecagon), used by 4612 / 31212. */
function dodecagon(): [number, number][] {
  const r = 1 / Math.sqrt(2 - SQRT3);
  const off = Math.PI / 12;
  const out: [number, number][] = [];
  for (let s = 0; s < 12; s += 1) {
    const theta = off + (s / 12) * 2 * Math.PI;
    out.push([r * Math.cos(theta), r * Math.sin(theta)]);
  }
  return out;
}

/** Six hexagon corners + twelve outer-square corners (3464 / 333333_33434). */
function hexPlusSquares(ux: number, uy: number): [number, number][] {
  const out: [number, number][] = [
    [-0.5 * ux, 1.0 * uy],
    [0.5 * ux, 1.0 * uy],
    [1.0 * ux, 0.0 * uy],
    [0.5 * ux, -1.0 * uy],
    [-0.5 * ux, -1.0 * uy],
    [-1.0 * ux, 0.0 * uy],
  ];
  const a = 1 + SQRT3 / 2;
  const h = a / Math.cos((15 * Math.PI) / 180);
  for (let n = 0; n < 12; n += 1) {
    const theta = ((15 + n * 30) * Math.PI) / 180;
    out.push([h * Math.cos(theta), h * Math.sin(theta)]);
  }
  return out;
}

const dim = (n: number, dflt = 3): number => (Number.isFinite(n) ? n : dflt);

/** Triangle clip used by tri/hex Triangle shapes: lower-left triangle. */
const triClip: Keep = (row, col) => row <= col;

// ---------------------------------------------------------------------------
// Custom / Limping hexagon  — @java CustomOnHex.eval + main.math.Polygon
//
// `(hex a b)` (two dims, no shape keyword) routes in Java to
// `new CustomOnHex({a, b})` (Hex.construct:80-84). It is a *polygon* board: a
// hexagonal boundary is walked side-by-side with `polygonFromSides`, inflated
// outwards by 0.1, then every hex-tiling cell whose centroid falls inside is
// kept. This is NOT a regular hexagon — e.g. `(hex 5 6)` is a 63-cell limping
// hexagon, not the 61-cell regular hexagon `(hex 5)` produces. Stargazers'
// 12-Star carves this 63-cell base down to 39.
// ---------------------------------------------------------------------------

/** Hex.xy(row,col) centroid — @java Hex.xy (unit = 1). */
const hexXY = (row: number, col: number): [number, number] => [
  SQRT3 * (col - 0.5 * row),
  1.5 * row,
];

/**
 * @java CustomOnHex.polygonFromSides — walk the boundary, turning at each
 * corner. Each side length is reduced by one before stepping (the cell-vs-edge
 * fudge), and a zero-length side only turns. Returns boundary points in xy.
 */
function polygonFromSides(sides: readonly number[]): [number, number][] {
  const steps: readonly [number, number][] = [
    [1, 0], [1, 1], [0, 1], [-1, 0], [-1, -1], [0, -1],
  ];
  let step = 1;
  let row = 0;
  let col = 0;
  const pts: [number, number][] = [hexXY(row, col)];
  const n = Math.max(5, sides.length);
  for (let i = 0; i < n; i += 1) {
    let nextStep = sides[i % sides.length] as number;
    nextStep += nextStep < 0 ? 1 : -1;
    step += nextStep < 0 ? -1 : 1;
    step = (step + 6) % 6;
    if (nextStep > 0) {
      const s = steps[step] as [number, number];
      row += nextStep * s[0];
      col += nextStep * s[1];
      pts.push(hexXY(row, col));
    }
  }
  return pts;
}

/** Tri.xy(row,col) lattice point — @java Tri.xy (unit = 1). */
const triXY = (row: number, col: number): [number, number] => [
  col - 0.5 * row,
  (SQRT3 / 2) * row,
];

/**
 * @java CustomOnTri.polygonFromSides — identical side walk to CustomOnHex, but
 * sampled on Tri.xy. `(tri Limping n)` reaches this through Tri.construct:
 * `new CustomOnTri({n, n+1})`.
 */
function triPolygonFromSides(sides: readonly number[]): [number, number][] {
  const steps: readonly [number, number][] = [
    [1, 0], [1, 1], [0, 1], [-1, 0], [-1, -1], [0, -1],
  ];
  let dirn = 1;
  let row = 0;
  let col = 0;
  const pts: [number, number][] = [triXY(row, col)];
  const n = Math.max(5, sides.length);
  for (let i = 0; i < n; i += 1) {
    let nextStep = sides[i % sides.length] as number;
    nextStep += nextStep < 0 ? 1 : -1;
    dirn += nextStep < 0 ? -1 : 1;
    dirn = (dirn + 6) % 6;
    if (nextStep > 0) {
      const s = steps[dirn] as [number, number];
      row += nextStep * s[0];
      col += nextStep * s[1];
      pts.push(triXY(row, col));
    }
  }
  return pts;
}

/**
 * @java main.math.Polygon.inflate — push every vertex outward along its edge
 * bisector by `amount`, so cell centroids never sit exactly on the boundary.
 */
function inflatePolygon(pts: [number, number][], amount: number): void {
  const m = pts.length;
  const adj: [number, number][] = [];
  const norm = (vx: number, vy: number): [number, number] => {
    const len = Math.hypot(vx, vy);
    return len === 0 ? [0, 0] : [(vx / len) * amount, (vy / len) * amount];
  };
  for (let i = 0; i < m; i += 1) {
    const a = pts[i] as [number, number];
    const b = pts[(i + 1) % m] as [number, number];
    const c = pts[(i + 2) % m] as [number, number];
    // @java MathRoutines.clockwise: cross product < EPSILON.
    const cross = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
    const cw = cross < 1e-7;
    const [ix, iy] = cw ? norm(b[0] - a[0], b[1] - a[1]) : norm(a[0] - b[0], a[1] - b[1]);
    const [ox, oy] = cw ? norm(b[0] - c[0], b[1] - c[1]) : norm(c[0] - b[0], c[1] - b[1]);
    adj.push([(ix + ox) * 0.5, (iy + oy) * 0.5]);
  }
  for (let i = 0; i < m; i += 1) {
    const a = adj[(i - 1 + m) % m] as [number, number];
    const p = pts[i] as [number, number];
    pts[i] = [p[0] + a[0], p[1] + a[1]];
  }
}

/** @java main.math.Polygon.contains — even-odd ray cast. */
function polygonContains(pts: readonly [number, number][], x: number, y: number): boolean {
  let j = pts.length - 1;
  let odd = false;
  for (let i = 0; i < pts.length; i += 1) {
    const [ix, iy] = pts[i] as [number, number];
    const [jx, jy] = pts[j] as [number, number];
    if (((iy < y && jy >= y) || (jy < y && iy >= y)) && (ix <= x || jx <= x)) {
      if (ix + ((y - iy) / (jy - iy)) * (jx - ix) < x) odd = !odd;
    }
    j = i;
  }
  return odd;
}

/**
 * `(hex a b)` Custom/Limping hexagon — @java CustomOnHex.eval. Builds the
 * boundary polygon, inflates it, and stamps the six hex corners of every cell
 * whose centroid lies inside, then joins unit-apart corners and reorders.
 */
function genHexCustom(
  sides: readonly number[],
  ref: readonly (readonly [number, number])[],
): Graph {
  const poly = polygonFromSides(sides);
  inflatePolygon(poly, 0.1);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [px, py] of poly) {
    if (px < minX) minX = px;
    if (py < minY) minY = py;
    if (px > maxX) maxX = px;
    if (py > maxY) maxY = py;
  }
  // @java bounds → integer row/col scan window, padded by 3, filtered by contains.
  const fromCol = Math.trunc(minX) - 3;
  const fromRow = Math.trunc(minY) - 3;
  const toCol = Math.trunc(maxX) + 3;
  const toRow = Math.trunc(maxY) + 3;
  const g = new Graph();
  for (let r = fromRow; r <= toRow; r += 1) {
    for (let c = fromCol; c <= toCol; c += 1) {
      const [px, py] = hexXY(r, c);
      if (!polygonContains(poly, px, py)) continue;
      for (const [dx, dy] of ref) g.addVertex(px + dx, py + dy, DEDUP);
    }
  }
  const vs = g.vertices;
  for (let a = 0; a < vs.length; a += 1) {
    const va = vs[a]!;
    for (let b = a + 1; b < vs.length; b += 1) {
      const vb = vs[b]!;
      if (Math.abs(Math.hypot(va.x - vb.x, va.y - vb.y) - UNIT) < 0.01) g.addEdge(a, b);
    }
  }
  g.makeFaces();
  g.reorder();
  return g;
}

/**
 * `(tri Limping n)` / `(tri {sides…})` — @java Tri.construct + CustomOnTri.eval.
 * Builds the side-walk polygon for the given sides, inflates it, samples
 * Tri.xy lattice points inside it, then joins unit-apart vertices and reorders.
 * @java CustomOnTri.java:79-113
 */
export function genTriCustom(sides: readonly number[]): Graph {
  const poly = triPolygonFromSides(sides);
  inflatePolygon(poly, 0.1);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [px, py] of poly) {
    if (px < minX) minX = px;
    if (py < minY) minY = py;
    if (px > maxX) maxX = px;
    if (py > maxY) maxY = py;
  }
  const margin = Math.max(0, Math.trunc(sides[0] ?? 2));
  const fromCol = Math.trunc(minX) - margin;
  const fromRow = Math.trunc(minY) - margin;
  const toCol = Math.trunc(maxX) + margin;
  const toRow = Math.trunc(maxY) + margin;
  const g = new Graph();
  for (let r = fromRow; r <= toRow; r += 1) {
    for (let c = fromCol; c <= toCol; c += 1) {
      const [px, py] = triXY(r, c);
      if (!polygonContains(poly, px, py)) continue;
      g.addVertex(px, py, DEDUP);
    }
  }
  const vs = g.vertices;
  for (let a = 0; a < vs.length; a += 1) {
    const va = vs[a]!;
    for (let b = a + 1; b < vs.length; b += 1) {
      const vb = vs[b]!;
      if (Math.abs(Math.hypot(va.x - vb.x, va.y - vb.y) - UNIT) < 0.01) g.addEdge(a, b);
    }
  }
  g.makeFaces();
  g.reorder();
  return g;
}

/**
 * `(hex [shape] dimA [dimB])` — board on a regular hexagonal tiling (cells are
 * hexagons). Java: hex/Hex.java + shape variants.
 */
export function genHex(
  shape: string | undefined,
  dimA: number,
  dimB?: number,
): Graph {
  const a = dim(dimA);
  const b = dimB !== undefined && Number.isFinite(dimB) ? dimB : undefined;
  const ux = SQRT3 / 2;
  const ref: [number, number][] = [
    [0.0 * ux, 1.0],
    [1.0 * ux, 0.5],
    [1.0 * ux, -0.5],
    [0.0 * ux, -1.0],
    [-1.0 * ux, -0.5],
    [-1.0 * ux, 0.5],
  ];
  const hx = SQRT3;
  const hy = 3 / 2;
  const xy: XY = (r, c) => [hx * (c - 0.5 * r), hy * r];
  const st = (shape ?? "Hexagon").toLowerCase();
  switch (st) {
    case "rectangle":
    case "square": {
      // @java RectangleOnHex.eval — NOT a full rows×cols grid. Each row r keeps
      // the staggered column band `c ∈ [(r+1)/2, cols + r/2)` (integer floor
      // division), so even rows hold `cols` hexes and odd rows `cols−1`. For
      // `(hex Rectangle 13 12)` that is 7·12 + 6·11 = 150 cells (a plain grid
      // would wrongly give 156). Reorder afterwards to match Java's
      // `graph.reorder()` (line 96) canonical centroid numbering.
      const cols = b ?? a;
      const g = buildTiling({
        ref,
        rows: a,
        cols: cols + a,
        xy,
        keep: (row, col) =>
          !(col < Math.floor((row + 1) / 2) || col >= cols + Math.floor(row / 2)),
      });
      g.reorder();
      return g;
    }
    case "diamond":
    case "prism":
    case "rhombus": {
      // @java DiamondOnHex.eval — a rhombus (Hex's diamond) on the hex tiling.
      // Java uses a *transposed* placement that differs from the hexagon path:
      //   xy(row,col) = (hy·(col−row), hx·(row+col)·0.5),  hx=√3·unit, hy=1.5·unit
      // and swaps the corner-ref components when stamping each cell
      //   x += Hex.ref[n][1];  y += Hex.ref[n][0];
      // i.e. the diamond ref is Hex.ref with its two columns exchanged. For a
      // Diamond (dimB absent) it lays a full rows×rows lattice; for a Prism
      // (dimB given) it lays a (rows+cols−1)² lattice clipped to |row−col| <
      // rows. Finally `graph.reorder()` gives the canonical y·100+x numbering
      // the recorded trials use. Using the plain hexagon `ref`/`xy` here gave a
      // parallelogram with a different site numbering than Java.
      const rows = a;
      const cols = b ?? a;
      const isPrism = b !== undefined;
      const span = isPrism ? rows + cols - 1 : rows;
      const hx = SQRT3;
      const hy = 3 / 2;
      const dxy: XY = (r, c) => [hy * (c - r), hx * (r + c) * 0.5];
      const dref: [number, number][] = [
        [1.0, 0.0 * ux],
        [0.5, 1.0 * ux],
        [-0.5, 1.0 * ux],
        [-1.0, 0.0 * ux],
        [-0.5, -1.0 * ux],
        [0.5, -1.0 * ux],
      ];
      const g = buildTiling({
        ref: dref,
        rows: span,
        cols: span,
        xy: dxy,
        keep: isPrism ? (r, c) => Math.abs(r - c) < rows : undefined,
      });
      g.reorder();
      return g;
    }
    case "triangle":
      return buildTiling({ ref, rows: a, cols: a, xy, keep: triClip });
    case "limping":
      // @java Hex.java:94 — `case Limping: return new CustomOnHex({dimA, dimA+1})`
      return genHexCustom([a, a + 1], ref);
    default: {
      // @java Hex.construct: two dims with no shape keyword → CustomOnHex({a,b})
      // (a polygon/limping hexagon), NOT a regular hexagon. Single dim →
      // HexagonOnHex (regular hexagon, side a).
      if (b !== undefined) return genHexCustom([a, b], ref);
      const rows = 2 * a - 1;
      return buildTiling({ ref, rows, cols: rows, xy, keep: hexClipDiff });
    }
  }
}

/**
 * `(tri [shape] dimA [dimB])` — board on a triangular tiling (cells are
 * triangles; each lattice point is a vertex). Java: tri/Tri.java + variants.
 */
export function genTri(
  shape: string | undefined,
  dimA: number,
  dimB?: number,
  vertexMode = false,
): Graph {
  const a = dim(dimA);
  const b = dimB !== undefined && Number.isFinite(dimB) ? dimB : undefined;
  // @java every *OnTri.eval adds `+ (siteType == SiteType.Cell ? 1 : 0)` to its
  // dims, so vertex-played boards are one unit smaller than cell-played ones.
  const cell = vertexMode ? 0 : 1;
  const ref: [number, number][] = [[0, 0]];
  // @java Tri.xy(row,col).
  const xy: XY = triXY;
  const st = (shape ?? "Triangle").toLowerCase();
  switch (st) {
    case "limping":
      return genTriCustom([a, a + 1]);
    case "hexagon": {
      // @java HexagonOnTri.eval — d = dim + cell; rows = cols = 2d−1; keep
      // `col ≤ cols/2 + row && row − col ≤ cols/2` (= hexClipDiff).
      const d = a + cell;
      const rows = 2 * d - 1;
      return buildTiling({ ref, rows, cols: rows, xy, keep: hexClipDiff });
    }
    case "rectangle":
    case "square": {
      // @java RectangleOnTri.eval — rows = dimA+cell, cols = dimB+cell; the
      // column index runs `[0, cols+rows)` and keeps the staggered band
      // `(r+1)/2 ≤ c < cols + r/2` (integer floor division).
      const rows = a + cell;
      const cols = (b ?? a) + cell;
      return buildTiling({
        ref,
        rows,
        cols: cols + rows,
        xy,
        keep: (row, col) =>
          !(
            col < Math.floor((row + 1) / 2) ||
            col >= cols + Math.floor(row / 2)
          ),
      });
    }
    case "diamond":
    case "prism":
    case "rhombus": {
      // @java DiamondOnTri.eval — a *different* mapping than the other tri
      // shapes: xy(r,c) = (hy·(c−r), hx·(r+c)·0.5) with hx=unit=1, hy=√3/2.
      // Diamond: a full rows×cols lattice. Prism: a (rows+cols−1)² lattice
      // clipped to |r−c| < rows.
      const isPrism = st === "prism";
      const rows = a + cell;
      const cols = (isPrism ? (b ?? a) : a) + cell;
      const hy = SQRT3 / 2;
      const dxy: XY = (r, c) => [hy * (c - r), (r + c) * 0.5];
      if (isPrism) {
        const span = rows + cols - 1;
        return buildTiling({
          ref,
          rows: span,
          cols: span,
          xy: dxy,
          keep: (row, col) => Math.abs(row - col) < rows,
        });
      }
      return buildTiling({ ref, rows, cols, xy: dxy });
    }
    default: {
      // @java TriangleOnTri.eval — rows = cols = dim+cell; keep `r ≤ c`.
      const n = a + cell;
      return buildTiling({ ref, rows: n, cols: n, xy, keep: triClip });
    }
  }
}

/** Add a polygon's perimeter (vertices + closing edges) to a graph. */
function addPoly(g: Graph, pts: readonly (readonly [number, number])[]): void {
  const ids = pts.map(([x, y]) => g.addVertex(x, y));
  for (let i = 0; i < ids.length; i += 1)
    g.addEdge(ids[i]!, ids[(i + 1) % ids.length]!);
}

/**
 * `(brick [shape] dimA [dimB] [trim:bool])` — a running-bond brick wall: each
 * brick is a 2×1 hexagonal cell (mid-edge vertices included), rows offset by
 * half a brick. Java: brick/Brick.java + SquareOrRectangleOnBrick.
 */
export function genBrick(
  shape: string | undefined,
  dimA: number,
  dimB?: number,
  trim = false,
): Graph {
  const a = dim(dimA);
  let b = dimB !== undefined && Number.isFinite(dimB) ? dimB : a;
  if ((shape ?? "").toLowerCase() === "limping") b = a + 1;
  const rows = a;
  const cols = b * 2 + 1;
  const g = new Graph();
  const brick = (r: number, c: number): void =>
    addPoly(g, [
      [c, r],
      [c, r + 1],
      [c + 1, r + 1],
      [c + 2, r + 1],
      [c + 2, r],
      [c + 1, r],
    ]);
  const half = (r: number, c: number): void =>
    addPoly(g, [
      [c, r],
      [c, r + 1],
      [c + 1, r + 1],
      [c + 1, r],
    ]);
  for (let r = 0; r < rows; r += 1)
    for (let c = r % 2; c < cols; c += 2) {
      if (trim && c === 0) half(r, c + 1);
      else if (trim && c >= cols - 1) half(r, c);
      else brick(r, c);
    }
  g.makeFaces();
  return g;
}

type Pt = readonly [number, number];
const lerp = (t: number, p: Pt, q: Pt): Pt => [
  p[0] + (q[0] - p[0]) * t,
  p[1] + (q[1] - p[1]) * t,
];
const rot = (theta: number, p: Pt): Pt => {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
};

/**
 * `(quadhex layers)` — a hexagon tessellated by quadrilaterals (Three-Player
 * Chess board). Java: quadhex/Quadhex.sixUniformSections — six rotations of a
 * layers×layers quad-meshed triangle.
 */
export function genQuadhex(layers: number, thirds = false): Graph {
  const L = Math.max(1, Math.floor(dim(layers)));
  if (thirds) return genQuadhexThirds(L);
  const g = new Graph();
  const A: Pt = [0, 0];
  const B: Pt = [0, (L * SQRT3) / 2];
  const C: Pt = [L / 2, (L * SQRT3) / 2];
  const E: Pt = [L, 0];
  const D: Pt = [(C[0] + E[0]) / 2, (C[1] + E[1]) / 2];
  for (let rotn = 0; rotn < 6; rotn += 1) {
    const theta = (rotn * Math.PI) / 3;
    for (let row = 0; row < L; row += 1) {
      const r0 = row / L;
      const r1 = (row + 1) / L;
      const ptAD0 = rot(theta, lerp(r0, A, D));
      const ptAD1 = rot(theta, lerp(r1, A, D));
      const ptBC0 = rot(theta, lerp(r0, B, C));
      const ptBC1 = rot(theta, lerp(r1, B, C));
      for (let col = 0; col < L; col += 1) {
        const c0 = col / L;
        const c1 = (col + 1) / L;
        const ptAB0 = lerp(c0, ptAD0, ptBC0);
        const ptAB1 = lerp(c1, ptAD0, ptBC0);
        const ptDC1 = lerp(c1, ptAD1, ptBC1);
        const va = g.addVertex(ptAB0[0], ptAB0[1]);
        const vb = g.addVertex(ptAB1[0], ptAB1[1]);
        const vc = g.addVertex(ptDC1[0], ptDC1[1]);
        g.addEdge(va, vb);
        g.addEdge(vb, vc);
        if (row === L - 1) {
          const ptDC0 = lerp(c0, ptAD1, ptBC1);
          const vd = g.addVertex(ptDC0[0], ptDC0[1]);
          g.addEdge(vc, vd);
        }
      }
    }
  }
  g.makeFaces();
  return g;
}

function genQuadhexThirds(layers: number): Graph {
  const L32 = (layers * SQRT3) / 2;
  const A: Pt = [-layers / 2, -L32];
  const C: Pt = [-layers, 0];
  const E: Pt = [0, -L32];
  const O: Pt = [0, 0];
  const ratio = layers / (layers + 0.5);
  const F = lerp(ratio, E, O);
  const G = lerp(ratio / 2, A, C);

  const section = new Graph();
  for (let row = 0; row < layers; row += 1) {
    const r0 = row / layers;
    const r1 = (row + 1) / layers;
    const ptAE0 = lerp(r0, A, E);
    const ptAE1 = lerp(r1, A, E);
    const ptGF0 = lerp(r0, G, F);
    const ptGF1 = lerp(r1, G, F);

    for (let col = 0; col < layers; col += 1) {
      const c0 = col / layers;
      const c1 = (col + 1) / layers;
      const ptAG0 = lerp(c0, ptAE0, ptGF0);
      const ptAG1 = lerp(c1, ptAE0, ptGF0);
      const ptEF0 = lerp(c0, ptAE1, ptGF1);
      const ptEF1 = lerp(c1, ptAE1, ptGF1);

      const va = section.addVertex(ptAG0[0], ptAG0[1]);
      const vb = section.addVertex(ptAG1[0], ptAG1[1]);
      const vc = section.addVertex(ptEF0[0], ptEF0[1]);
      const vd = section.addVertex(ptEF1[0], ptEF1[1]);
      section.addEdge(va, vb);
      section.addEdge(vc, vd);
      section.addEdge(va, vc);
      section.addEdge(vb, vd);

      const vaa = section.addVertex(-ptAG0[0], ptAG0[1]);
      const vbb = section.addVertex(-ptAG1[0], ptAG1[1]);
      const vcc = section.addVertex(-ptEF0[0], ptEF0[1]);
      const vdd = section.addVertex(-ptEF1[0], ptEF1[1]);
      section.addEdge(vaa, vbb);
      section.addEdge(vcc, vdd);
      section.addEdge(vaa, vcc);
      section.addEdge(vbb, vdd);
    }
  }

  const graph = new Graph();
  const verticesPerSection = section.vertices.length;
  const theta = (2 * Math.PI) / 3;
  const save: number[][] = [[], [], []];

  for (let rotn = 0; rotn < 3; rotn += 1) {
    const offset = rotn * verticesPerSection;
    for (const vertex of section.vertices) {
      const [x, y] = rot(rotn * theta, [vertex.x, vertex.y]);
      graph.addVertex(x, y, 0);
    }
    for (const edge of section.edges)
      graph.addEdge(edge.a + offset, edge.b + offset);

    save[0]![rotn] = offset + 4 * layers;
    save[1]![rotn] = offset + 4 * layers + 2;
    save[2]![rotn] = offset + layers * (2 * layers + 3);
  }

  graph.addEdge(save[2]![0]!, save[2]![1]!);
  graph.addEdge(save[2]![1]!, save[2]![2]!);
  graph.addEdge(save[2]![2]!, save[2]![0]!);
  graph.addEdge(save[1]![0]!, save[0]![1]!);
  graph.addEdge(save[1]![1]!, save[0]![2]!);
  graph.addEdge(save[1]![2]!, save[0]![0]!);
  graph.makeFaces();
  return graph;
}

/** Inner-ring step count for a spiral (doubles each of the first layers). */
function spiralBaseNumber(numTurns: number, numSites: number): number {
  for (let base = 1; base < numSites; base += 1) {
    let steps = base;
    let total = 1;
    for (let ring = 1; ring < numTurns; ring += 1) {
      total += steps;
      if (total > numSites) {
        if (ring <= numTurns) return base - 1;
        break;
      }
      if (ring <= 2) steps *= 2;
    }
  }
  return 0;
}

/**
 * `(spiral turns:t sites:n [clockwise:bool])` — an Archimedean spiral path of
 * `n` vertices (e.g. the ancient Egyptian Mehen board). A line graph: vertices
 * joined consecutively, no faces. Java: shape/Spiral.java.
 */
export function genSpiral(
  turns: number,
  sites: number,
  clockwise = true,
): Graph {
  const numTurns = Math.max(1, Math.floor(dim(turns)));
  const numSites = Math.max(1, Math.floor(dim(sites)));
  const g = new Graph();
  // Spiral vertices must not be deduplicated — keep the exact site count.
  const add = (x: number, y: number): number => g.addVertex(x, y, -1);
  add(0, 0); // central pivot
  const base = spiralBaseNumber(numTurns, numSites);
  const thetas = new Array<number>(4 * numSites).fill(0);
  let index = 1;
  let steps = base;
  for (let ring = 1; ring <= numTurns + 1; ring += 1) {
    const dTheta = (Math.PI * 2) / steps;
    let theta = Math.PI * 2 * ring;
    if (ring <= 2 || ring % 2 === 1) theta -= dTheta / 2;
    for (let step = 0; step < steps; step += 1) {
      thetas[index] = theta;
      index += 1;
      theta += dTheta;
    }
    if (ring <= 2) steps *= 2;
  }
  for (let vid = 2; vid < numSites; vid += 1)
    thetas[vid] = ((thetas[vid - 1] ?? 0) + (thetas[vid + 1] ?? 0)) / 2;
  for (let vid = 2; vid < numSites; vid += 1)
    thetas[vid] = ((thetas[vid - 1] ?? 0) + (thetas[vid + 1] ?? 0)) / 2;
  thetas[1] = (thetas[1] ?? 0) - 0.5 * ((thetas[2] ?? 0) - (thetas[1] ?? 0));
  for (let vid = 1; vid < numSites; vid += 1) {
    const theta = thetas[vid] ?? 0;
    const r = theta; // a = 0, b = 1
    const x = clockwise ? -r * Math.cos(theta) : r * Math.cos(theta);
    const y = r * Math.sin(theta);
    add(x, y);
  }
  for (let vid = 0; vid < g.vertices.length - 1; vid += 1) g.addEdge(vid, vid + 1);
  g.makeFaces();
  return g;
}

/**
 * `(wedge rows [columns])` — a triangular wedge graph: a single apex vertex
 * over `rows-1` widening rows of `columns` vertices each (default 3), used to
 * graft triangular arms onto Alquerque-style boards. Java: shape/Wedge.java.
 * Vertices are added in row order without dedup so the apex is index 0 and
 * each non-apex row occupies a contiguous block, matching Java's edge indices.
 */
export function genWedge(rows: number, columns?: number): Graph {
  const r0 = Math.max(1, Math.floor(dim(rows)));
  const cols =
    columns !== undefined && Number.isFinite(columns)
      ? Math.max(2, Math.floor(columns))
      : 3;
  const g = new Graph();
  const mid = r0 - 1;
  for (let r = 0; r < r0; r += 1) {
    if (r === 0) {
      g.addVertex(mid, mid, -1);
    } else {
      const left = mid - r;
      const right = mid + r;
      for (let c = 0; c < cols; c += 1) {
        const t = c / (cols - 1);
        g.addVertex(left + (right - left) * t, mid - r, -1);
      }
    }
  }
  for (let r = 0; r < r0; r += 1) {
    if (r === 0) {
      for (let c = 0; c < cols; c += 1) g.addEdge(0, c + 1);
    } else {
      const from = r * cols - cols + 1;
      for (let c = 0; c < cols - 1; c += 1) g.addEdge(from + c, from + c + 1);
      if (r < r0 - 1) {
        for (let c = 0; c < cols; c += 1) g.addEdge(from + c, from + cols + c);
      }
    }
  }
  g.makeFaces();
  return g;
}

/**
 * `(regular [Star] numSides)` — a regular polygon ring, or a star polygon.
 * Java: generators/shape/Regular.java. Radius r = n / (2π); vertex i sits at
 * angle (offset + i/n · 2π). The polygon variant links each vertex to the
 * next; the star variant skips ⌊(n−1)/2⌋ vertices per edge.
 */
export function genRegular(star: boolean, numSides: number): Graph {
  const n = Math.max(3, Math.floor(numSides));
  const r = n / (2 * Math.PI);
  const offset = n === 4 ? Math.PI / 4 : Math.PI / 2;
  const g = new Graph();
  for (let i = 0; i < n; i += 1) {
    const theta = offset + (i / n) * 2 * Math.PI;
    g.addVertex(r * Math.cos(theta), r * Math.sin(theta), -1);
  }
  if (star) {
    const skip = Math.floor((n - 1) / 2);
    for (let i = 0; i < n; i += 1) g.addEdge(i, (i + skip) % n);
  } else {
    for (let i = 0; i < n; i += 1) g.addEdge(i, (i + 1) % n);
  }
  // @java Core/src/game/functions/graph/generators/shape/Regular.java reorders vertices by y*100+x before
  // use, so star/regular site indices match the engine's canonical numbering.
  g.reorder();
  g.makeFaces();
  return g;
}

/** Build a named tiling graph, or undefined if the name is unknown. */
export function buildNamedTiling(
  name: string,
  dimA: number,
  dimB?: number,
): Graph | undefined {
  const a = dim(dimA);
  const b = dimB !== undefined && Number.isFinite(dimB) ? dimB : undefined;

  switch (name.toUpperCase()) {
    case "T3636": {
      const ux = SQRT3 / 2;
      // raw ref [p,q] with x = p? Java swaps: x += ref[1], y += ref[0].
      const raw: [number, number][] = [
        [0, 1],
        [ux, 0.5],
        [ux, -0.5],
        [0, -1],
        [-ux, -0.5],
        [-ux, 0.5],
      ];
      const ref = raw.map(([p, q]) => [q, p] as [number, number]);
      const rows = 2 * a - 1;
      const cols = 2 * (b ?? a) - 1;
      return buildTiling({
        ref,
        rows,
        cols,
        xy: (r, c) => [2 * (c - 0.5 * r), SQRT3 * r],
        keep: b === undefined ? hexClipDiff : undefined,
      });
    }
    case "T33344": {
      const raw: [number, number][] = [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
      ];
      const ref = raw.map(([p, q]) => [q, p] as [number, number]);
      const dx = 1;
      const dy = 1 + SQRT3 / 2;
      return buildTiling({
        ref,
        rows: a,
        cols: b ?? a,
        xy: (r, c) => [(c + 0.5 * r) * dx, r * dy],
      });
    }
    case "T33434": {
      const u2 = 0.5;
      const u3 = SQRT3 / 2;
      const ref: [number, number][] = [
        [-1 * u2 + 0 * u3, -1 * u2 - 1 * u3],
        [1 * u2 + 0 * u3, -1 * u2 - 1 * u3],
        [-1 * u2 - 1 * u3, 0 * u2 - 1 * u3],
        [1 * u2 + 1 * u3, 0 * u2 - 1 * u3],
        [0 * u2 + 0 * u3, -1 * u2 + 0 * u3],
        [-2 * u2 - 1 * u3, 0 * u2 + 0 * u3],
        [0 * u2 - 1 * u3, 0 * u2 + 0 * u3],
        [0 * u2 + 1 * u3, 0 * u2 + 0 * u3],
        [2 * u2 + 1 * u3, 0 * u2 + 0 * u3],
        [0 * u2 + 0 * u3, 1 * u2 + 0 * u3],
        [-1 * u2 - 1 * u3, 0 * u2 + 1 * u3],
        [1 * u2 + 1 * u3, 0 * u2 + 1 * u3],
        [-1 * u2 + 0 * u3, 1 * u2 + 1 * u3],
        [1 * u2 + 0 * u3, 1 * u2 + 1 * u3],
      ];
      const hx = (1 + SQRT3) / 2;
      return buildTiling({
        ref,
        rows: a,
        cols: a,
        xy: (r, c) => [hx * (c - r), hx * (r + c)],
      });
    }
    case "T488": {
      const u = 1;
      const v = u * (1 + 2 / Math.sqrt(2));
      const ref: [number, number][] = [
        [u / 2, v / 2],
        [v / 2, u / 2],
        [v / 2, -u / 2],
        [u / 2, -v / 2],
        [-u / 2, -v / 2],
        [-v / 2, -u / 2],
        [-v / 2, u / 2],
        [-u / 2, v / 2],
      ];
      return buildTiling({
        ref,
        rows: a,
        cols: b ?? a,
        xy: (r, c) => [c * v, r * v],
      });
    }
    case "T3464": {
      const ux = 1;
      const uy = SQRT3 / 2;
      const ref = hexPlusSquares(ux, uy);
      const hx = 1 + SQRT3;
      const hy = (3 + SQRT3) / 2;
      const rows = 2 * a - 1;
      return buildTiling({
        ref,
        rows,
        cols: rows,
        xy: (r, c) => [hy * (c - r), hx * (r + c) * 0.5],
        keep: hexClipDiff,
      });
    }
    case "T333333_33434": {
      const ux = 1;
      const uy = SQRT3 / 2;
      const ref = hexPlusSquares(ux, uy);
      const hx = 1.5 + SQRT3;
      const hy = 2 + SQRT3;
      const rows = 2 * a - 1;
      return buildTiling({
        ref,
        rows,
        cols: rows,
        xy: (r, c) => [hx * (c - r), hy * (r + c) * 0.5],
        keep: hexClipAbs,
      });
    }
    case "T4612": {
      const dx = 4.7320508;
      const dy = (dx * SQRT3) / 2;
      const rows = 2 * a - 1;
      return buildTiling({
        ref: dodecagon(),
        rows,
        cols: rows,
        xy: (r, c) => [(c - 0.5 * r) * dx, r * dy],
        keep: hexClipAbs,
      });
    }
    case "T31212": {
      const dx = 3.7320508;
      const dy = (dx * SQRT3) / 2;
      const rows = 2 * a - 1;
      return buildTiling({
        ref: dodecagon(),
        rows,
        cols: rows,
        xy: (r, c) => [(c - 0.5 * r) * dx, r * dy],
        keep: hexClipAbs,
      });
    }
    case "T33336": {
      const ux = 0.5;
      const uy = SQRT3 / 2;
      const ref: [number, number][] = [
        [-1 * ux, 1 * uy],
        [1 * ux, 1 * uy],
        [2 * ux, 0 * uy],
        [1 * ux, -1 * uy],
        [-1 * ux, -1 * uy],
        [-2 * ux, 0 * uy],
        [-2 * ux, 2 * uy],
        [0 * ux, 2 * uy],
        [2 * ux, 2 * uy],
        [3 * ux, 1 * uy],
        [4 * ux, 0 * uy],
        [3 * ux, -1 * uy],
        [2 * ux, -2 * uy],
        [0 * ux, -2 * uy],
        [-2 * ux, -2 * uy],
        [-3 * ux, -1 * uy],
        [-4 * ux, 0 * uy],
        [-3 * ux, 1 * uy],
      ];
      const rows = 2 * a - 1;
      return buildTiling({
        ref,
        rows,
        cols: rows,
        xy: (r, c) => [c * 5 * ux - r * 4 * ux, r * 2 * uy + c * uy],
        keep: hexClipAbs,
      });
    }
    default:
      return undefined;
  }
}

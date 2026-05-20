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
    case "square":
      return buildTiling({ ref, rows: a, cols: b ?? a, xy });
    case "diamond":
    case "prism":
    case "rhombus":
      return buildTiling({ ref, rows: a, cols: b ?? a, xy });
    case "triangle":
      return buildTiling({ ref, rows: a, cols: a, xy, keep: triClip });
    default: {
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
): Graph {
  const a = dim(dimA);
  const b = dimB !== undefined && Number.isFinite(dimB) ? dimB : undefined;
  const ref: [number, number][] = [[0, 0]];
  const xy: XY = (r, c) => [c - 0.5 * r, (SQRT3 / 2) * r];
  const st = (shape ?? "Triangle").toLowerCase();
  switch (st) {
    case "hexagon": {
      const rows = 2 * (a + 1) - 1;
      return buildTiling({ ref, rows, cols: rows, xy, keep: hexClipDiff });
    }
    case "rectangle":
    case "square":
    case "diamond":
    case "prism":
    case "rhombus":
      return buildTiling({ ref, rows: a + 1, cols: (b ?? a) + 1, xy });
    default:
      return buildTiling({ ref, rows: a + 1, cols: a + 1, xy, keep: triClip });
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
export function genQuadhex(layers: number): Graph {
  const L = Math.max(1, Math.floor(dim(layers)));
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

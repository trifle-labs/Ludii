/**
 * Board-shape generators — Java parity with
 * Core/src/game/functions/graph/generators/**. Each returns a planar
 * {@link Graph}; faces are computed by the caller (or here when the shape's
 * cells are needed). Coordinates are laid out so the angle-binned direction
 * model in trajectories.ts yields the expected compass neighbours.
 */

import { Graph } from "./graph.js";

/**
 * `(square n)` — an n×n grid. Java `RectangleOnSquare` sizes the vertex grid as
 * `dim + (Cell ? 1 : 0)`: in Cell play this is an n×n grid of unit-square cells
 * ((n+1)² vertices); in Vertex play (alquerque / Go / morris / hunt) the n
 * counts vertices directly, giving exactly n² intersections.
 */
export function genSquare(
  n: number,
  vertexMode = false,
  diagonals?: string,
): Graph {
  return genRectangle(n, n, vertexMode, diagonals);
}

/**
 * `(square n pyramidal:True) use:Vertex` — the Shibumi square pyramid. Java
 * `RectangleOnSquare.eval` (pyramidal branch): an n×n base layer of vertices at
 * z = 0, then successively smaller layers (n−1)², (n−2)², … 1² stacked in the
 * dimples above, each layer offset by (½, ½) and raised by `layer/√2` (so every
 * tetrahedral edge has unit length). Vertices are then renumbered by Java's
 * `reorder` score `y·100 + x` — which uses only the 2-D projection, so the
 * stacked layers interleave by column/row. We emit them already in that final
 * order (stable, lower layer first on a tie) and join only *within-layer*
 * orthogonal neighbours; the cross-layer "support" relation that `(is Flat)`
 * needs is recovered geometrically from the per-vertex z, not stored as edges
 * (keeping the 2-D trajectory/face machinery free of phantom diagonal hops
 * between the overlapping projections).
 */
export function genSquarePyramidal(n: number): Graph {
  const N = Math.max(1, Math.floor(n));
  const dz = 1 / Math.SQRT2;
  // Generate every layer's vertices with their logical grid coords, tagged with
  // a structural insertion index (base layer first) for the stable tie-break.
  interface PV {
    x: number;
    y: number;
    z: number;
    layer: number;
    col: number;
    row: number;
    struct: number;
  }
  const raw: PV[] = [];
  let struct = 0;
  for (let layer = 0; layer < N; layer += 1) {
    const size = N - layer;
    const off = layer * 0.5;
    for (let row = 0; row < size; row += 1)
      for (let col = 0; col < size; col += 1) {
        raw.push({
          x: off + col,
          y: off + row,
          z: layer * dz,
          layer,
          col,
          row,
          struct: struct,
        });
        struct += 1;
      }
  }
  // Java reorder: ascending `y·100 + x`, stable (lower struct ⇒ lower layer wins
  // a tie). `Array.prototype.sort` is stable, so a struct tie-break suffices.
  raw.sort((a, b) => a.y * 100 + a.x - (b.y * 100 + b.x) || a.struct - b.struct);

  const g = new Graph();
  // (layer,col,row) → final vertex id, for within-layer edge wiring.
  const idOf = new Map<string, number>();
  raw.forEach((v, finalId) => {
    g.pushVertex3D(v.x, v.y, v.z);
    idOf.set(`${v.layer}:${v.col}:${v.row}`, finalId);
  });
  // Within-layer orthogonal edges (the only structural edges, exactly as Java's
  // `makeEdges` keeps for a flat grid — the tetrahedral support edges are unit
  // length too, but we deliberately omit them from the graph; see header).
  for (let layer = 0; layer < N; layer += 1) {
    const size = N - layer;
    for (let row = 0; row < size; row += 1)
      for (let col = 0; col < size; col += 1) {
        const a = idOf.get(`${layer}:${col}:${row}`);
        if (a === undefined) continue;
        if (col + 1 < size) {
          const b = idOf.get(`${layer}:${col + 1}:${row}`);
          if (b !== undefined) g.addEdge(a, b);
        }
        if (row + 1 < size) {
          const b = idOf.get(`${layer}:${col}:${row + 1}`);
          if (b !== undefined) g.addEdge(a, b);
        }
      }
  }
  g.makeFaces();
  return g;
}

/**
 * `(rectangle rows cols)` — rows×cols grid (see {@link genSquare} on vertexMode).
 * `diagonals` adds the optional diagonal edges (`Alternating` / `Solid` /
 * `SolidNoSplit` / `Concentric`), matching Java `Square.handleDiagonals`.
 */
export function genRectangle(
  rows: number,
  cols: number,
  vertexMode = false,
  diagonals?: string,
): Graph {
  // In Cell play the dim counts cells, so the vertex grid is (dim+1) per side;
  // in Vertex play the dim already counts vertices (one fewer cell per side).
  const r = Math.max(1, Math.floor(rows)) - (vertexMode ? 1 : 0);
  const c = Math.max(1, Math.floor(cols)) - (vertexMode ? 1 : 0);
  const g = new Graph();
  const W = c + 1;
  const id = (x: number, y: number): number => y * W + x;
  for (let y = 0; y <= r; y += 1)
    for (let x = 0; x <= c; x += 1) g.addVertex(x, y);
  for (let y = 0; y <= r; y += 1)
    for (let x = 0; x <= c; x += 1) {
      if (x < c) g.addEdge(id(x, y), id(x + 1, y));
      if (y < r) g.addEdge(id(x, y), id(x, y + 1));
    }
  addDiagonals(g, r, c, id, diagonals);
  g.makeFaces();
  // @java RectangleOnSquare.eval — after handleDiagonals + makeFaces it calls
  // graph.reorder(), renumbering all elements by the `y*100+x` position score.
  // For a plain grid this is a no-op (already row-major), but `diagonals:Solid`
  // appends cell-centre vertices out of position; reorder slots them into their
  // geometric index (e.g. the 5×5 board's centre becomes the median site 20),
  // which is what `BeforeAfterCentreSetup` and capture geometry depend on.
  g.reorder();
  return g;
}

/**
 * Add diagonal edges across grid cells, matching Java
 * `Square.handleDiagonals`. Each cell has corners A=(c,r), B=(c,r+1),
 * C=(c+1,r+1), D=(c+1,r); the chosen diagonal depends on the type.
 */
function addDiagonals(
  g: Graph,
  r: number,
  c: number,
  id: (x: number, y: number) => number,
  diagonals?: string,
): void {
  if (!diagonals) return;
  const type = diagonals.toLowerCase();
  const midRow = r / 2;
  const midCol = c / 2;
  for (let row = 0; row < r; row += 1)
    for (let col = 0; col < c; col += 1) {
      const a = id(col, row);
      const b = id(col, row + 1);
      const cc = id(col + 1, row + 1);
      const d = id(col + 1, row);
      switch (type) {
        case "alternating":
          if ((row + col) % 2 === 0) g.addEdge(a, cc);
          else g.addEdge(b, d);
          break;
        case "solidnosplit":
          g.addEdge(a, cc);
          g.addEdge(b, d);
          break;
        case "solid": {
          // A central vertex split joins all four corners.
          const x = g.addVertex(col + 0.5, row + 0.5);
          g.addEdge(a, x);
          g.addEdge(b, x);
          g.addEdge(cc, x);
          g.addEdge(d, x);
          break;
        }
        case "concentric":
          if ((row < midRow && col < midCol) || (row >= midRow && col >= midCol))
            g.addEdge(b, d);
          else g.addEdge(a, cc);
          break;
        default:
          break;
      }
    }
  if (type === "radiating") addRadiatingDiagonals(g, r, c, id);
}

/**
 * `diagonals:Radiating` — draw only the two long diagonals through the centre,
 * matching Java `Square.handleDiagonals` (DiagonalsType.Radiating). Walks
 * outward from the centre vertex along the four ±1/±1 rays, adding an edge
 * between consecutive vertices on each ray. Java passes (midRow, midCol) as the
 * (x, y) of `findVertex`, so this mirrors that exact argument order (identical
 * to the natural order on square boards, which is all Radiating is used on).
 */
function addRadiatingDiagonals(
  g: Graph,
  r: number,
  c: number,
  id: (x: number, y: number) => number,
): void {
  const dsteps: readonly (readonly [number, number])[] = [
    [1, 1], [1, -1], [-1, -1], [-1, 1],
  ];
  const midRow = Math.floor(r / 2);
  const midCol = Math.floor(c / 2);
  const numSteps = Math.max(Math.floor(r / 2), Math.floor(c / 2)) + 1;
  const vId = (x: number, y: number): number | null =>
    x >= 0 && x <= c && y >= 0 && y <= r ? id(x, y) : null;
  for (let n = 0; n < numSteps; n += 1)
    for (const [d0, d1] of dsteps) {
      const va = vId(midRow + n * d0, midCol + n * d1);
      const vb = vId(midRow + (n + 1) * d0, midCol + (n + 1) * d1);
      if (va === null || vb === null) continue;
      g.addEdge(va, vb);
    }
}

/**
 * `(circle {c0 c1 …} [stagger:bool])` — concentric circular rings; ring r holds
 * `counts[r]` vertices evenly spaced on a circle of radius r. A count of 1 is a
 * single centre vertex; 0 leaves that ring empty. Each ring is joined into a
 * cycle and consecutive rings are spoked at their nearest vertices.
 */
export function genCircle(counts: readonly number[], stagger = false): Graph {
  const g = new Graph();
  const ringVerts: number[][] = [];
  for (let r = 0; r < counts.length; r += 1) {
    const k = Math.max(0, Math.floor(counts[r] ?? 0));
    const verts: number[] = [];
    if (k === 1) {
      verts.push(g.addVertex(0, 0));
    } else if (k > 1) {
      const radius = r === 0 ? 1 : r;
      const offset = stagger && r % 2 === 1 ? Math.PI / k : 0;
      for (let i = 0; i < k; i += 1) {
        const a = offset + (2 * Math.PI * i) / k;
        verts.push(g.addVertex(radius * Math.cos(a), radius * Math.sin(a)));
      }
    }
    ringVerts.push(verts);
    // Ring cycle.
    if (verts.length > 2)
      for (let i = 0; i < verts.length; i += 1)
        g.addEdge(verts[i] as number, verts[(i + 1) % verts.length] as number);
  }
  // Radial spokes: connect each vertex of an outer ring to the nearest vertex
  // of the previous non-empty ring.
  for (let r = 1; r < ringVerts.length; r += 1) {
    const inner = lastNonEmpty(ringVerts, r);
    const outer = ringVerts[r] ?? [];
    if (!inner || inner.length === 0) continue;
    for (const ov of outer) g.addEdge(ov, nearest(g, ov, inner));
  }
  g.makeFaces();
  return g;
}

/**
 * `(concentric {c0 c1 …})` — circular (wheel) board. Faithful port of Java
 * `ConcentricCircle` (game.functions.graph.generators.shape.concentric):
 * `generateForVertices` for vertex play, `generateForCells` (approximated via
 * {@link genCircle}) otherwise. The vertex path is the one that matters for
 * site numbering: Java numbers vertices ring-major from the innermost given
 * ring outward, theta-sorted within each ring, so e.g. an 8-ring board of 4
 * cells each yields sites 0-3 (inner) … 28-31 (outer), matching the games'
 * `(track …)` definitions.
 */
export function genConcentricCounts(
  counts: readonly number[],
  vertexMode = false,
  stagger = false,
): Graph {
  return vertexMode
    ? genConcentricCircleVerts(counts, stagger)
    : genCircle(counts, stagger);
}

/**
 * Faithful port of `ConcentricCircle.generateForVertices`. When the innermost
 * given ring has more than one cell, Java prepends a virtual 0-vertex centre
 * ring so the supplied rings sit at radii 1..n (NOT 0..n-1, which would collide
 * the first two rings). Vertices are created ring-major, theta-sorted, so the
 * resulting site numbering matches Java's Topology (no later reorder for the
 * circular basis).
 */
function genConcentricCircleVerts(
  cellsPerRing: readonly number[],
  stagger: boolean,
): Graph {
  const g = new Graph();
  if (cellsPerRing.length === 0) return g;
  if (cellsPerRing.length === 1) {
    // A single ring count is a simple polygon (Java simplePolygon).
    const numSides = cellsPerRing[0] as number;
    if (numSides >= 3) {
      const r = numSides / (2 * Math.PI);
      const offset = numSides === 4 ? Math.PI / 4 : Math.PI / 2;
      const ids: number[] = [];
      for (let n = 0; n < numSides; n += 1) {
        const theta = offset + (n / numSides) * 2 * Math.PI;
        ids.push(g.addVertex(r * Math.cos(theta), r * Math.sin(theta)));
      }
      for (let n = 0; n < numSides; n += 1)
        g.addEdge(ids[n] as number, ids[(n + 1) % numSides] as number);
    }
    g.makeFaces();
    return g;
  }

  // Java: when |cells[0]| > 1, prepend a 0-count centre ring (no pivot vertex).
  const vertsPerRing: number[] =
    Math.abs(cellsPerRing[0] as number) > 1
      ? [0, ...cellsPerRing]
      : [...cellsPerRing];
  const numRings = vertsPerRing.length;
  const ref = Math.PI / 2; // orient first vertex to the top

  interface Sample {
    x: number;
    y: number;
    theta: number;
  }
  const samples: Sample[][] = [];
  for (let ring = 0; ring < numRings; ring += 1) {
    const vertsThisRing = Math.abs(vertsPerRing[ring] as number);
    const r = ring;
    const ringOffset =
      stagger && ring % 2 === 1 ? (2 * Math.PI) / vertsThisRing / 2 : 0;
    const arr: Sample[] = [];
    for (let step = 0; step < vertsThisRing; step += 1) {
      const theta = ref + ringOffset - (2 * Math.PI * step) / vertsThisRing;
      arr.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), theta });
    }
    samples.push(arr);
  }

  // Order samples by angle (rings 1..n; ring 0 is the centre).
  for (let ring = 1; ring < numRings; ring += 1)
    (samples[ring] as Sample[]).sort((a, b) =>
      a.theta === b.theta ? 0 : a.theta < b.theta ? -1 : 1,
    );

  // Remove near-coincident samples within a ring (Java tolerance 0.1).
  for (let ring = 1; ring < numRings; ring += 1) {
    const arr = samples[ring] as Sample[];
    for (let n = arr.length - 1; n > 0; n -= 1) {
      const a = arr[n] as Sample;
      const b = arr[(n + arr.length - 1) % arr.length] as Sample;
      if (Math.hypot(a.x - b.x, a.y - b.y) < 0.1) arr.splice(n, 1);
    }
  }

  // Create vertices ring-major (this fixes the site numbering).
  for (let ring = 0; ring < numRings; ring += 1)
    for (const s of samples[ring] as Sample[]) g.addVertex(s.x, s.y);

  // Concentric edges around each ring (rings 1..n, ring count >= 2).
  for (let ring = 1; ring < numRings; ring += 1) {
    if ((vertsPerRing[ring] as number) < 2) continue;
    const arr = samples[ring] as Sample[];
    const ringSize = arr.length;
    if (ringSize < 2) continue;
    for (let n = 0; n < ringSize; n += 1) {
      const a = arr[n] as Sample;
      const b = arr[(n + 1) % ringSize] as Sample;
      const va = g.addVertex(a.x, a.y);
      const vb = g.addVertex(b.x, b.y);
      if (va !== vb) g.addEdge(va, vb);
    }
  }

  // Perpendicular spokes between consecutive rings.
  const noPivot = (vertsPerRing[0] as number) === 0;
  for (let ring = 0; ring < numRings - 1; ring += 1) {
    for (const s of samples[ring] as Sample[]) {
      const va = g.findVertex(s.x, s.y);
      if (va < 0) continue;
      if (ring === 0) {
        for (const sB of samples[1] as Sample[]) {
          const vb = g.findVertex(sB.x, sB.y);
          if (vb >= 0) g.addEdge(va, vb);
        }
      } else {
        const ratio = (ring + 1) / ring;
        const vb = g.findVertex(s.x * ratio, s.y * ratio);
        if (vb >= 0) {
          g.addEdge(va, vb);
          // No-centre boards: each outer (ring+1) vertex pivots around its
          // radially-inner (ring) vertex (Java `vertexB.setPivot(vertexA)`).
          if (noPivot) g.setPivot(vb, va);
        }
      }
    }
  }

  // A centre vertex exists (vertsPerRing[0] != 0): every vertex pivots around
  // the centre at (0,0) (Java ConcentricCircle.generateForVertices tail).
  if (!noPivot) {
    const centre = g.findVertex(0, 0);
    if (centre >= 0) {
      for (const v of g.vertices) g.setPivot(v.id, centre);
    }
  }

  g.makeFaces();
  return g;
}

const POLY_SIDES: Record<string, number> = {
  triangle: 3,
  square: 4,
  pentagon: 5,
  hexagon: 6,
  target: 0, // handled as circular single-cell rings
};

/**
 * `(concentric <Polygon> rings:N [joinCorners] [joinMidpoints] [steps:k])` —
 * N nested regular polygons (Morris-family boards). Each ring carries the
 * polygon's corners plus one midpoint per side (8 points for a square). Rings
 * are joined around their perimeter; spokes connect midpoints (default) and/or
 * corners (joinCorners) of consecutive rings.
 */
export function genConcentricPolygon(
  shape: string,
  rings: number,
  joinCorners: boolean,
  joinMidpoints: boolean,
  steps?: number,
): Graph {
  const name = shape.toLowerCase();
  const sides = POLY_SIDES[name] ?? 4;
  const N = Math.max(1, Math.floor(rings));
  if (sides === 0) {
    // Target: N rings each a single circle of `steps` cells (default 8).
    const k = Math.max(1, Math.floor(steps ?? 8));
    return genCircle(Array.from({ length: N + 1 }, (_, r) => (r === 0 ? 1 : k)));
  }
  const g = new Graph();
  // @java ConcentricRegular.eval — corner angles `ref + arc*side` where
  // `ref = π/2 + (even sides ? arc/2 : 0)`. The half-arc offset for even-sided
  // polygons is essential: for a square it puts corners at the diagonals and
  // chord-midpoints at the orthogonal edge-centres (the canonical Morris
  // layout), so the inter-ring midpoint spokes run N/S/E/W — not diagonally.
  // Rings step by 2 for triangles, else by 1 (Java `numSides == 3 ? 2 : 1`).
  const arc = (2 * Math.PI) / sides;
  const ref = Math.PI / 2 + (sides % 2 === 0 ? arc / 2 : 0);
  const cornerAngle = (i: number): number => ref + arc * i;
  const ringStep = sides === 3 ? 2 : 1;
  const ringCorners: number[][] = [];
  const ringMids: number[][] = [];
  for (let r = 0; r < N; r += 1) {
    const radius = 1 + r * ringStep;
    const corners: number[] = [];
    const mids: number[] = [];
    for (let i = 0; i < sides; i += 1) {
      const a = cornerAngle(i);
      corners.push(g.addVertex(radius * Math.cos(a), radius * Math.sin(a)));
      const a2 = cornerAngle(i + 1);
      const mx = (Math.cos(a) + Math.cos(a2)) / 2;
      const my = (Math.sin(a) + Math.sin(a2)) / 2;
      mids.push(g.addVertex(radius * mx, radius * my));
    }
    ringCorners.push(corners);
    ringMids.push(mids);
    // Perimeter: corner_i — mid_i — corner_{i+1} — …
    for (let i = 0; i < sides; i += 1) {
      g.addEdge(corners[i] as number, mids[i] as number);
      g.addEdge(mids[i] as number, corners[(i + 1) % sides] as number);
    }
  }
  // Spokes between consecutive rings. @java ConcentricRegular: midpoint spokes
  // when joinMidpoints (default True), corner spokes when joinCorners — the two
  // are independent, so a board may have both (e.g. the diagonal Morris board).
  for (let r = 1; r < N; r += 1) {
    if (joinMidpoints) {
      const a = ringMids[r - 1] as number[];
      const b = ringMids[r] as number[];
      for (let i = 0; i < sides; i += 1)
        g.addEdge(a[i] as number, b[i] as number);
    }
    if (joinCorners) {
      const a = ringCorners[r - 1] as number[];
      const b = ringCorners[r] as number[];
      for (let i = 0; i < sides; i += 1)
        g.addEdge(a[i] as number, b[i] as number);
    }
  }
  // @java ConcentricRegular.eval: reorder() (vertices + edges by y·100+x) runs
  // *before* makeFaces, so recorded site indices match Java's canonical
  // bottom-to-top/left-to-right numbering and faces (Cell play) reference the
  // final ids in makeFaces' natural order.
  g.reorder();
  g.makeFaces();
  return g;
}

function lastNonEmpty(rings: number[][], before: number): number[] | undefined {
  for (let i = before - 1; i >= 0; i -= 1) {
    const r = rings[i];
    if (r && r.length > 0) return r;
  }
  return undefined;
}

function nearest(g: Graph, from: number, candidates: readonly number[]): number {
  const fv = g.vertices[from];
  let best = candidates[0] as number;
  let bestD = Number.POSITIVE_INFINITY;
  for (const c of candidates) {
    const cv = g.vertices[c];
    if (!fv || !cv) continue;
    const d = (fv.x - cv.x) ** 2 + (fv.y - cv.y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/**
 * Board-shape generators — Java parity with
 * Core/src/game/functions/graph/generators/**. Each returns a planar
 * {@link Graph}; faces are computed by the caller (or here when the shape's
 * cells are needed). Coordinates are laid out so the angle-binned direction
 * model in trajectories.ts yields the expected compass neighbours.
 */

import { Graph } from "./graph.js";

/** `(square n)` — an n×n grid of unit-square cells ((n+1)² vertices). */
export function genSquare(n: number): Graph {
  return genRectangle(n, n);
}

/** `(rectangle rows cols)` — rows×cols unit-square cells. */
export function genRectangle(rows: number, cols: number): Graph {
  const r = Math.max(1, Math.floor(rows));
  const c = Math.max(1, Math.floor(cols));
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
  g.makeFaces();
  return g;
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
 * `(concentric {c0 c1 …})` — like {@link genCircle} but the rings are filled
 * (a centre point is common). Shares the circular layout.
 */
export function genConcentricCounts(counts: readonly number[]): Graph {
  return genCircle(counts, false);
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
  // Corner angles of the polygon; midpoints sit halfway between corners.
  const cornerAngle = (i: number): number =>
    Math.PI / 2 + (2 * Math.PI * i) / sides; // first corner pointing up
  const ringCorners: number[][] = [];
  const ringMids: number[][] = [];
  for (let r = 1; r <= N; r += 1) {
    const corners: number[] = [];
    const mids: number[] = [];
    for (let i = 0; i < sides; i += 1) {
      const a = cornerAngle(i);
      corners.push(g.addVertex(r * Math.cos(a), r * Math.sin(a)));
      const a2 = cornerAngle(i + 1);
      const mx = (Math.cos(a) + Math.cos(a2)) / 2;
      const my = (Math.sin(a) + Math.sin(a2)) / 2;
      mids.push(g.addVertex(r * mx, r * my));
    }
    ringCorners.push(corners);
    ringMids.push(mids);
    // Perimeter: corner_i — mid_i — corner_{i+1} — …
    for (let i = 0; i < sides; i += 1) {
      g.addEdge(corners[i] as number, mids[i] as number);
      g.addEdge(mids[i] as number, corners[(i + 1) % sides] as number);
    }
  }
  // Spokes between consecutive rings.
  for (let r = 1; r < N; r += 1) {
    if (joinMidpoints || (!joinCorners && !joinMidpoints)) {
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

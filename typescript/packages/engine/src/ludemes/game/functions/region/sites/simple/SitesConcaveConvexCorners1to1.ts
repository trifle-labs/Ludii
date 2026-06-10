/**
 * SitesConcaveConvexCorners1to1.ts
 * @java game/functions/region/sites/simple/SitesConcaveCorners.java
 * @java game/functions/region/sites/simple/SitesConvexCorners.java
 *
 * (sites ConcaveCorners) — all perimeter vertex sites where the boundary
 *   bends inward (negative curvature score).
 * (sites ConvexCorners)  — all perimeter vertex sites where the boundary
 *   bends outward (positive curvature score).
 *
 * Java eval delegates to graph.cornersConcave(realType) / cornersConvex(realType),
 * which in turn use MeasureGraph.cornersFromPerimeter:
 *   score = Σ_k ( sideDistToLine(pt, a_k, b_k) / k ) with convex-positive sign
 *   • score ≥ 0.32 after smoothing → CONVEX corner  (graph.ts cornersFromPerimeter:182-202)
 *   • score ≤ −0.25 after smoothing → CONCAVE corner (graph.ts cornersFromPerimeter:203-214)
 *
 * TS: we re-implement the same scoring on the perimeter vertex ring obtained
 * from (traj as any).perimeterVertexIds + (traj as any).core.topo.verts.
 * For square/rectangle boards (no trajectories) we fall back to the four
 * physical corners (all convex, no concave corners).
 */

import type { Context } from "../../../../../../context.js";
import type { RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { registerRegion1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import type { Game1to1 } from "../../../../../Game1to1.js";

// ---------------------------------------------------------------------------
// Geometry helpers
// (faithful re-implementation of graph.ts cornersFromPerimeter scoring)
// ---------------------------------------------------------------------------

/** Signed area of a polygon (CCW positive). */
function polygonSignedArea(poly: readonly [number, number][]): number {
  let area = 0;
  const n = poly.length;
  for (let i = 0; i < n; i += 1) {
    const [ax, ay] = poly[i] as [number, number];
    const [bx, by] = poly[(i + 1) % n] as [number, number];
    area += ax * by - bx * ay;
  }
  return area / 2;
}

/** Signed distance from point (px,py) to line through (ax,ay)-(bx,by).
 *  Positive on the left (CCW) side of the directed line a→b.
 *  @java MeasureGraph.sideDistToLine
 */
function sideDistToLine(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const len = Math.hypot(bx - ax, by - ay);
  if (len === 0) return 0;
  return ((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len;
}

/** True when the turn a→pt→b is clockwise.
 *  @java MeasureGraph.sideClockwise
 */
function sideClockwise(
  ax: number, ay: number,
  px: number, py: number,
  bx: number, by: number,
): boolean {
  return (px - ax) * (by - ay) - (py - ay) * (bx - ax) < 0;
}

/**
 * Re-implementation of graph.ts `cornersFromPerimeter` that returns
 * separate convex (positive) and concave (negative) corner index sets.
 * Indices are into the `poly` array (= positions in the perimeter ring).
 *
 * @java Core/src/other/util/graph/MeasureGraph.java — cornersFromPerimeter
 */
function cornersFromPerimeterTyped(
  poly: readonly [number, number][],
): { convexIdx: Set<number>; concaveIdx: Set<number> } {
  const num = poly.length;
  const convexIdx = new Set<number>();
  const concaveIdx = new Set<number>();
  if (num < 6) {
    for (let i = 0; i < num; i += 1) convexIdx.add(i);
    return { convexIdx, concaveIdx };
  }
  const tol = 0.001;
  const numK = 4;
  const scores = new Array<number>(num).fill(0);
  for (let n = 0; n < num; n += 1) {
    const pt = poly[n] as [number, number];
    let score = 0;
    for (let k = 1; k < numK; k += 1) {
      const a = poly[(n - k + num) % num] as [number, number];
      const b = poly[(n + k) % num] as [number, number];
      let dist = sideDistToLine(pt[0], pt[1], a[0], a[1], b[0], b[1]);
      if (sideClockwise(a[0], a[1], pt[0], pt[1], b[0], b[1])) dist = -dist;
      score += dist / k;
    }
    scores[n] = score;
  }
  // Smoothing pass (@java MeasureGraph.cornersFromPerimeter smooth step)
  const temp = new Array<number>(num);
  for (let n = 0; n < num; n += 1) {
    temp[n] =
      (4 * (scores[n] as number) +
        (scores[(n + 1) % num] as number) +
        (scores[(n - 1 + num) % num] as number)) /
      6;
  }
  for (let n = 0; n < num; n += 1) scores[n] = temp[n] as number;

  // Convex corners (score ≥ 0.32, local max)
  const keepConvex = new Array<boolean>(num).fill(true);
  for (let n = 0; n < num; n += 1) {
    const s = scores[n] as number;
    if (
      s < 0.32 ||
      s < (scores[(n - 1 + num) % num] as number) - tol ||
      s < (scores[(n + 1) % num] as number) - tol
    )
      keepConvex[n] = false;
  }
  const similar = 0.95;
  for (let n = 0; n < num; n += 1) {
    if (!keepConvex[n]) continue;
    const s = scores[n] as number;
    if ((scores[(n - 1 + num) % num] as number) >= similar * s)
      keepConvex[(n - 1 + num) % num] = true;
    if ((scores[(n + 1) % num] as number) >= similar * s)
      keepConvex[(n + 1) % num] = true;
  }
  for (let n = 0; n < num; n += 1) if (keepConvex[n]) convexIdx.add(n);

  // Concave corners (score ≤ −0.25, local min)
  const keepConcave = new Array<boolean>(num).fill(true);
  for (let n = 0; n < num; n += 1) {
    const s = scores[n] as number;
    if (
      s > -0.25 ||
      s > (scores[(n - 1 + num) % num] as number) + tol ||
      s > (scores[(n + 1) % num] as number) + tol
    )
      keepConcave[n] = false;
  }
  for (let n = 0; n < num; n += 1) if (keepConcave[n]) concaveIdx.add(n);

  return { convexIdx, concaveIdx };
}

// ---------------------------------------------------------------------------
// Corner extraction from Trajectories
// ---------------------------------------------------------------------------

interface VertexLike { readonly pt: { readonly x: number; readonly y: number } }

/**
 * Access perimeter vertex positions in ring order from a Trajectories object.
 * Returns null if the data is inaccessible.
 */
function perimeterVertexRings(traj: Trajectories): Array<Array<readonly [number, number, number]>> | null {
  // Access (traj as any).perimeterVertexIds — ordered ring(s) of vertex ids.
  // In practice a single connected board has one ring; multi-ring boards (rare)
  // may have several. We process each ring independently.
  const trajAny = traj as unknown as {
    perimeterVertexIds?: readonly number[];
    core?: { topo?: { verts?: VertexLike[] } };
  };
  const perim = trajAny.perimeterVertexIds;
  const verts = trajAny.core?.topo?.verts;
  if (!perim || perim.length < 3 || !verts) return null;
  // Map vertex id → [x, y, vertexId]
  const ring: Array<readonly [number, number, number]> = perim.map((vid) => {
    const v = verts[vid];
    return v ? [v.pt.x, v.pt.y, vid] : [0, 0, vid];
  });
  return [ring];
}

/**
 * Returns site indices for convex or concave perimeter corners.
 * In Vertex play, site id = vertex id.
 * In Cell play, Java returns the *face* ids of faces at corners —
 * but `cornersSites()` on a Cell board returns undefined.
 * For Cell play we approximate: a face is a corner face when any of its
 * vertices is a corner vertex.
 */
function cornerSitesTyped(
  ctx: Context,
  traj: Trajectories,
  kind: "convex" | "concave",
): number[] {
  const rings = perimeterVertexRings(traj);
  if (!rings) return [];

  const cornerVids = new Set<number>();

  for (const ring of rings) {
    const poly: [number, number][] = ring.map(([x, y]) => [x, y]);
    // Ensure CCW winding (positive area)
    if (polygonSignedArea(poly) < 0) {
      ring.reverse();
      poly.reverse();
    }
    const { convexIdx, concaveIdx } = cornersFromPerimeterTyped(poly);
    const idxSet = kind === "convex" ? convexIdx : concaveIdx;
    for (const n of idxSet) {
      const entry = ring[n];
      if (entry) cornerVids.add(entry[2]);
    }
  }

  if (cornerVids.size === 0) return [];

  // Vertex play: site id = vertex id directly
  if (traj.kind === "Vertex") {
    return [...cornerVids].filter((id) => id >= 0 && id < traj.numSites).sort((a, b) => a - b);
  }

  // Cell play: return face ids whose vertices include a corner vertex
  // @java graph.cornersConvex(Cell) / graph.cornersConcave(Cell)
  const trajAny = traj as unknown as {
    core?: { topo?: { faceEls?: Array<{ id: number; vertices: Array<{ id: number }> }> } };
  };
  const faceEls = trajAny.core?.topo?.faceEls;
  if (!faceEls) return [];
  const result: number[] = [];
  for (const f of faceEls) {
    if (f.vertices.some((v) => cornerVids.has(v.id))) {
      result.push(f.id);
    }
  }
  return result.sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// Square-board fallback
// ---------------------------------------------------------------------------

function squareBoardConvexCorners(ctx: Context): number[] {
  const g = ctx.game as unknown as Game1to1;
  const W = g.equipment.board.width;
  const H = g.equipment.board.height;
  if (W === 0 || H === 0) return [];
  const n = g.equipment.board.numSites;
  return [...new Set([0, W - 1, n - W, n - 1])].sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// ConcaveCorners class
// ---------------------------------------------------------------------------

export class SitesConcaveCorners1to1 implements RegionFunction {
  /**
   * @java game/functions/region/sites/simple/SitesConcaveCorners.java — eval(Context)
   */
  public eval(ctx: Context): number[] {
    const ctxT = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxT._trajectories;
    if (traj) {
      return cornerSitesTyped(ctx, traj, "concave");
    }
    // Square boards have no concave corners
    return [];
  }
}

// ---------------------------------------------------------------------------
// ConvexCorners class
// ---------------------------------------------------------------------------

export class SitesConvexCorners1to1 implements RegionFunction {
  /**
   * @java game/functions/region/sites/simple/SitesConvexCorners.java — eval(Context)
   */
  public eval(ctx: Context): number[] {
    const ctxT = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxT._trajectories;
    if (traj) {
      return cornerSitesTyped(ctx, traj, "convex");
    }
    // Square board: four corners (all convex)
    return squareBoardConvexCorners(ctx);
  }
}

// ---------------------------------------------------------------------------
// Registrations
// ---------------------------------------------------------------------------


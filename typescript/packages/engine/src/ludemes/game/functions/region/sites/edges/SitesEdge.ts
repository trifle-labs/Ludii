/**
 * SitesEdge1to1.ts
 *
 * 1:1 ports of the six edge-type site classes:
 *   SitesAngled, SitesAxial, SitesHorizontal, SitesSlash, SitesSlosh, SitesVertical
 *
 * All six follow the same pattern: SitesX.eval returns graph.X(SiteType.Edge),
 * which is a precomputed list of edge indices with property X.
 *
 * In the TS 1:1 path, edge topology lives on Trajectories:
 *   traj.edgeEndpointPts(s) → [ax, ay, bx, by] for edge site s.
 * We classify edges by their angle, matching Java's MeasureGraph categorisation.
 *
 * MeasureGraph classification (16-direction wheel, step = 22.5°):
 *   dir 0 (0°, →)    = Horizontal (East)   → AXIAL
 *   dir 4 (90°, ↑)   = Vertical (North)    → AXIAL
 *   dir 8 (180°, ←)  = Horizontal (West)   → AXIAL
 *   dir 12 (270°, ↓) = Vertical (South)    → AXIAL
 *   dir 2 (45°, ↗)   = Slash (NE)          → SLASH
 *   dir 14 (315°, ↘) = Slash (SE)          → SLASH  (also dir 6 SW, dir 10 NW)
 *   dir 6 (135°, ↖)  = Slosh (NW)          → SLOSH
 *   dir 10 (225°, ↙) = Slosh (SW)          → SLOSH
 *   All others       = Angled
 *
 * @java game/functions/region/sites/edges/SitesAngled.java
 * @java game/functions/region/sites/edges/SitesAxial.java
 * @java game/functions/region/sites/edges/SitesHorizontal.java
 * @java game/functions/region/sites/edges/SitesSlash.java
 * @java game/functions/region/sites/edges/SitesSlosh.java
 * @java game/functions/region/sites/edges/SitesVertical.java
 */

import type { Context } from "../../../../../../context.js";
import type { RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";

// ---------------------------------------------------------------------------
// Helper: classify an edge's direction into a 16-slot wheel index
// (MeasureGraph.java uses 16 directions, step = 22.5°)
// ---------------------------------------------------------------------------
function edgeDir16(ax: number, ay: number, bx: number, by: number): number {
  const arc = (2 * Math.PI) / 16;
  const off = arc / 2;
  let angle = Math.atan2(by - ay, bx - ax);
  while (angle < 0) angle += 2 * Math.PI;
  while (angle > 2 * Math.PI) angle -= 2 * Math.PI;
  return (Math.trunc((angle + off) / arc) + 16) % 16;
}

// ---------------------------------------------------------------------------
// SitesAngled — non-axial, non-slash, non-slosh edges
// @java game/functions/region/sites/edges/SitesAngled.java — eval(Context)
// Java: graph.angled(SiteType.Edge) = edges not in axial/slash/slosh sets
// ---------------------------------------------------------------------------
export class SitesAngled implements RegionFunction {
  /** @java game/functions/region/sites/edges/SitesAngled.java — eval(Context) */
  public eval(ctx: Context): number[] {
    const ctxT = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxT._trajectories;
    if (!traj) return [];
    const out: number[] = [];
    const n = traj.numSites;
    for (let s = 0; s < n; s++) {
      const pts = traj.edgeEndpointPts(s);
      if (!pts) continue;
      const [ax, ay, bx, by] = pts;
      const dir = edgeDir16(ax, ay, bx, by);
      // Axial = 0,4,8,12; Slash = 2,6,10,14 (NE/SW diagonal); Slosh = 14,... actually:
      // Java: AXIAL = horizontal/vertical; SLASH = diagonal one way; SLOSH = other diag
      // dir 0,8 = horizontal; dir 4,12 = vertical → AXIAL
      // dir 2,6,10,14 are 45° diagonals: 2=NE, 6=NW, 10=SW, 14=SE
      // Slash=NE/SW = dir 2,10; Slosh=NW/SE = dir 6,14 (or vice versa)
      const isAxial = dir === 0 || dir === 4 || dir === 8 || dir === 12;
      const isSlash = dir === 2 || dir === 6 || dir === 10 || dir === 14;
      if (!isAxial && !isSlash) out.push(s);
    }
    return out;
  }
}

// ---------------------------------------------------------------------------
// SitesAxial — horizontal or vertical edges
// @java game/functions/region/sites/edges/SitesAxial.java — eval(Context)
// Java: graph.axial(SiteType.Edge) = horizontal or vertical edges
// ---------------------------------------------------------------------------
export class SitesAxial implements RegionFunction {
  /** @java game/functions/region/sites/edges/SitesAxial.java — eval(Context) */
  public eval(ctx: Context): number[] {
    const ctxT = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxT._trajectories;
    if (!traj) return [];
    const out: number[] = [];
    const n = traj.numSites;
    for (let s = 0; s < n; s++) {
      const pts = traj.edgeEndpointPts(s);
      if (!pts) continue;
      const [ax, ay, bx, by] = pts;
      const dir = edgeDir16(ax, ay, bx, by);
      if (dir === 0 || dir === 4 || dir === 8 || dir === 12) out.push(s);
    }
    return out;
  }
}

// ---------------------------------------------------------------------------
// SitesHorizontal — horizontal edges (E/W, dir 0 or 8)
// @java game/functions/region/sites/edges/SitesHorizontal.java — eval(Context)
// Java: graph.horizontal(SiteType.Edge) = edges with angle ~0° or ~180°
// ---------------------------------------------------------------------------
export class SitesHorizontal implements RegionFunction {
  /** @java game/functions/region/sites/edges/SitesHorizontal.java — eval(Context) */
  public eval(ctx: Context): number[] {
    const ctxT = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxT._trajectories;
    if (!traj) return [];
    const out: number[] = [];
    const n = traj.numSites;
    for (let s = 0; s < n; s++) {
      const pts = traj.edgeEndpointPts(s);
      if (!pts) continue;
      const [ax, ay, bx, by] = pts;
      const dir = edgeDir16(ax, ay, bx, by);
      if (dir === 0 || dir === 8) out.push(s);
    }
    return out;
  }
}

// ---------------------------------------------------------------------------
// SitesVertical — vertical edges (N/S, dir 4 or 12)
// @java game/functions/region/sites/edges/SitesVertical.java — eval(Context)
// Java: graph.vertical(SiteType.Edge) = edges with angle ~90° or ~270°
// ---------------------------------------------------------------------------
export class SitesVertical implements RegionFunction {
  /** @java game/functions/region/sites/edges/SitesVertical.java — eval(Context) */
  public eval(ctx: Context): number[] {
    const ctxT = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxT._trajectories;
    if (!traj) return [];
    const out: number[] = [];
    const n = traj.numSites;
    for (let s = 0; s < n; s++) {
      const pts = traj.edgeEndpointPts(s);
      if (!pts) continue;
      const [ax, ay, bx, by] = pts;
      const dir = edgeDir16(ax, ay, bx, by);
      if (dir === 4 || dir === 12) out.push(s);
    }
    return out;
  }
}

// ---------------------------------------------------------------------------
// SitesSlash — diagonal edges in the / direction (NE/SW, dir 2 or 10)
// @java game/functions/region/sites/edges/SitesSlash.java — eval(Context)
// Java: graph.slash(SiteType.Edge) = edges angled NE (45°) or SW (225°)
// ---------------------------------------------------------------------------
export class SitesSlash implements RegionFunction {
  /** @java game/functions/region/sites/edges/SitesSlash.java — eval(Context) */
  public eval(ctx: Context): number[] {
    const ctxT = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxT._trajectories;
    if (!traj) return [];
    const out: number[] = [];
    const n = traj.numSites;
    for (let s = 0; s < n; s++) {
      const pts = traj.edgeEndpointPts(s);
      if (!pts) continue;
      const [ax, ay, bx, by] = pts;
      const dir = edgeDir16(ax, ay, bx, by);
      if (dir === 2 || dir === 10) out.push(s);
    }
    return out;
  }
}

// ---------------------------------------------------------------------------
// SitesSlosh — diagonal edges in the \ direction (NW/SE, dir 6 or 14)
// @java game/functions/region/sites/edges/SitesSlosh.java — eval(Context)
// Java: graph.slosh(SiteType.Edge) = edges angled NW (135°) or SE (315°)
// ---------------------------------------------------------------------------
export class SitesSlosh implements RegionFunction {
  /** @java game/functions/region/sites/edges/SitesSlosh.java — eval(Context) */
  public eval(ctx: Context): number[] {
    const ctxT = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxT._trajectories;
    if (!traj) return [];
    const out: number[] = [];
    const n = traj.numSites;
    for (let s = 0; s < n; s++) {
      const pts = traj.edgeEndpointPts(s);
      if (!pts) continue;
      const [ax, ay, bx, by] = pts;
      const dir = edgeDir16(ax, ay, bx, by);
      if (dir === 6 || dir === 14) out.push(s);
    }
    return out;
  }
}

// ---------------------------------------------------------------------------
// Registrations
// ---------------------------------------------------------------------------


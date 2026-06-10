/**
 * SitesMajor.ts
 * @java game/functions/region/sites/simple/SitesMajor.java
 *
 * (sites Major) — returns all "major" sites: faces with the maximum vertex count.
 *
 * Java eval:
 *   graph.major(realType)
 * which MeasureGraph defines as faces with the MAXIMUM number of vertices/sides
 * (e.g. hexagons on a Cairo tiling that mixes pentagons and hexagons).
 *
 * TS: walk core topology faceEls, find max vertex count, return face ids with that count.
 * For non-Cell play (Edge/Vertex), return all sites (Java fallback).
 */

import type { Context } from "../../../../../../context.js";
import type { RegionFunction, EvalScratch } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import type { Game1to1 } from "../../../../../Game1to1.js";

/** Minimal shape of FaceEl from core topology. */
interface FaceLike {
  readonly id: number;
  readonly vertices: readonly unknown[];
}

export class SitesMajor implements RegionFunction {
  /**
   * @java game/functions/region/sites/simple/SitesMajor.java — eval(Context)
   * Returns graph.major(realType) — sites with the maximum vertex count.
   */
  public eval(ctx: Context & EvalScratch): number[] {
    // @java graph.major(realType) — MeasureGraph marks faces with max vertex count as MAJOR
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (traj) {
      if (traj.kind !== "Cell") {
        // Non-cell play: return all sites (Java fallback for non-face topologies)
        return Array.from({ length: traj.numSites }, (_, i) => i);
      }
      const core = (traj as unknown as {
        core?: { topo?: { faceEls?: FaceLike[] } }
      }).core;
      const faceEls = core?.topo?.faceEls;
      if (faceEls && faceEls.length > 0) {
        let maxSides = 0;
        for (const f of faceEls) {
          if (f.vertices.length > maxSides) maxSides = f.vertices.length;
        }
        return faceEls
          .filter((f) => f.vertices.length === maxSides)
          .map((f) => f.id);
      }
      // No faceEls: return all cell sites as fallback
      return Array.from({ length: traj.numSites }, (_, i) => i);
    }
    // No trajectory: return all board sites
    const g = ctx.game as unknown as Game1to1;
    const n = g.equipment ? g.equipment.board.numSites : ctx.state.cells.length;
    return Array.from({ length: n }, (_, i) => i);
  }
}


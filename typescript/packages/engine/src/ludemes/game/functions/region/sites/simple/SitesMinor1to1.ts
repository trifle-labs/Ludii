/**
 * SitesMinor1to1.ts
 * @java game/functions/region/sites/simple/SitesMinor.java
 *
 * (sites Minor) — returns all "minor" sites: faces with fewer than the maximum vertex count.
 *
 * Java eval:
 *   graph.minor(realType)
 * which MeasureGraph defines as faces with FEWER than the maximum number of vertices/sides
 * (e.g. pentagons on a Cairo tiling that mixes pentagons and hexagons).
 *
 * TS: walk core topology faceEls, find max vertex count, return face ids with LESS than that count.
 * For non-Cell play (Edge/Vertex), return empty (no minor concept).
 */

import type { Context } from "../../../../../../context.js";
import type { RegionFunction, EvalScratch } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import { registerRegion1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

/** Minimal shape of FaceEl from core topology. */
interface FaceLike {
  readonly id: number;
  readonly vertices: readonly unknown[];
}

export class SitesMinor1to1 implements RegionFunction {
  /**
   * @java game/functions/region/sites/simple/SitesMinor.java — eval(Context)
   * Returns graph.minor(realType) — sites with fewer than the maximum vertex count.
   */
  public eval(ctx: Context & EvalScratch): number[] {
    // @java graph.minor(realType) — MeasureGraph marks faces with < max vertex count as MINOR
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (traj) {
      if (traj.kind !== "Cell") {
        // Non-cell play: no minor faces concept — return empty
        return [];
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
          .filter((f) => f.vertices.length < maxSides)
          .map((f) => f.id);
      }
      return [];
    }
    // No trajectory: no minor concept available
    return [];
  }
}


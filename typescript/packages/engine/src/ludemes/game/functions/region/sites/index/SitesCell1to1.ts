/**
 * SitesCell1to1.ts
 * @java game/functions/region/sites/index/SitesCell.java
 *
 * (sites Cell <index>) — returns the vertex ids of the cell at the given index.
 *
 * Java eval: topology.cells().get(i).vertices() — the vertex ids forming the cell polygon.
 * TS: access face FaceEl.vertices[] from the core topology via _trajectories.
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction, RegionFunction, EvalScratch } from "../../../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";

/** Minimal shape of the FaceEl we access from core topology. */
interface FaceLike {
  readonly vertices: ReadonlyArray<{ readonly id: number }>;
}

export class SitesCell1to1 implements RegionFunction {
  private readonly indexFn: IntFunction;

  public constructor(indexFn: IntFunction) {
    this.indexFn = indexFn;
  }

  /**
   * @java game/functions/region/sites/index/SitesCell.java — eval(Context)
   * Returns cell.vertices() — the vertex ids of the cell's boundary polygon.
   */
  public eval(ctx: Context & EvalScratch): number[] {
    // @java topology.cells().get(i).vertices()
    const i = this.indexFn.eval(ctx);
    if (i < 0) return [];

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (traj) {
      // Access the underlying core topology's faceEls for face→vertex mapping.
      const core = (traj as unknown as {
        core?: { topo?: { faceEls?: FaceLike[] } }
      }).core;
      const faceEls = core?.topo?.faceEls;
      if (faceEls && i < faceEls.length) {
        const face = faceEls[i];
        if (face) {
          return face.vertices.map((v) => v.id);
        }
      }
      return [];
    }
    // No trajectory: cannot return cell vertices — return empty.
    return [];
  }
}


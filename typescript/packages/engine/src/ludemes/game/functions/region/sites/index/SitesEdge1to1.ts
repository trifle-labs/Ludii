/**
 * SitesEdge1to1.ts
 * @java game/functions/region/sites/index/SitesEdge.java
 *
 * (sites Edge <index>) — returns the two vertex endpoint ids of the edge at the given index.
 *
 * Java eval:
 *   edge = topology.edges().get(i)
 *   return [edge.vA().index(), edge.vB().index()]
 *
 * TS: Trajectories.edgeEndpoints(site) returns [vaId, vbId] for an Edge-play board.
 * For Cell/Vertex-play boards, access EdgeEl from core topology.
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction, RegionFunction, EvalScratch } from "../../../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import { registerRegion1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1 } from "../../../../../../compiler1to1.js";

/** Minimal shape of EdgeEl from core topology. */
interface EdgeLike {
  readonly va: { readonly id: number };
  readonly vb: { readonly id: number };
}

export class SitesEdge1to1 implements RegionFunction {
  private readonly indexFn: IntFunction;

  public constructor(indexFn: IntFunction) {
    this.indexFn = indexFn;
  }

  /**
   * @java game/functions/region/sites/index/SitesEdge.java — eval(Context)
   * Returns [edge.vA().index(), edge.vB().index()] for the edge at the given index.
   */
  public eval(ctx: Context & EvalScratch): number[] {
    // @java edge = topology.edges().get(i); return [edge.vA().index(), edge.vB().index()]
    const i = this.indexFn.eval(ctx);
    if (i < 0) return [];

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (traj) {
      // Case 1: Edge-play board — edgeEndpoints() works directly on play-sites.
      if (traj.kind === "Edge") {
        const eps = traj.edgeEndpoints(i);
        if (eps) return [eps[0], eps[1]];
        return [];
      }
      // Case 2: Cell/Vertex-play board — look up graph edge by index from core topology.
      const core = (traj as unknown as {
        core?: { topo?: { edgeEls?: EdgeLike[] } }
      }).core;
      const edgeEls = core?.topo?.edgeEls;
      if (edgeEls && i < edgeEls.length) {
        const edge = edgeEls[i];
        if (edge) return [edge.va.id, edge.vb.id];
      }
      return [];
    }
    // No trajectory available — cannot resolve edge endpoints.
    return [];
  }
}


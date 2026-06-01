/**
 * CountEdges1to1.ts
 * @java game/functions/ints/count/simple/CountEdges.java
 *
 * (count Edges) — returns the number of edges in the board graph.
 *
 * Java eval: context.game().board().topology().edges().size()
 * TS: access via core topology edgeEls or via Trajectories when kind=Edge.
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction, EvalScratch } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../eval/graph/trajectories.js";
import { registerInt1to1, type Compile1to1Env } from "../../../../registry1to1.js";

export class CountEdges1to1 implements IntFunction {
  /**
   * @java game/functions/ints/count/simple/CountEdges.java — eval(Context)
   * Returns context.game().board().topology().edges().size()
   */
  public eval(ctx: Context & EvalScratch): number {
    // @java context.game().board().topology().edges().size()
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (traj) {
      // Access the underlying core topology's edgeEls array for the edge count.
      // (CountEdges always returns graph-level edge count regardless of play type.)
      const core = (traj as unknown as { core?: { topo?: { edgeEls?: unknown[] } } }).core;
      if (core?.topo?.edgeEls) {
        return core.topo.edgeEls.length;
      }
      // Fallback: if play type is Edge, numSites IS the edge count.
      if (traj.kind === "Edge") {
        return traj.numSites;
      }
    }
    // Plain square board fallback: edges = rows*(cols-1) + (rows-1)*cols
    const g = ctx.game as unknown as { equipment?: { board?: { width?: number; height?: number } } };
    const W = g.equipment?.board?.width ?? 0;
    const H = g.equipment?.board?.height ?? 0;
    if (W > 0 && H > 0) {
      return H * (W - 1) + (H - 1) * W;
    }
    return 0;
  }
}

registerInt1to1("count:edges", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  void _node; void _env;
  return new CountEdges1to1();
});

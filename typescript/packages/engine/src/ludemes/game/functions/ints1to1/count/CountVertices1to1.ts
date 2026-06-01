/**
 * CountVertices1to1.ts
 * @java game/functions/ints/count/simple/CountVertices.java
 *
 * (count Vertices) — returns the number of vertices in the board graph.
 *
 * Java eval: context.game().board().topology().vertices().size()
 * TS: Trajectories.vertexCount = core.topo.verts.length
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction, EvalScratch } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../eval/graph/trajectories.js";
import { registerInt1to1, type Compile1to1Env } from "../../../../registry1to1.js";

export class CountVertices1to1 implements IntFunction {
  /**
   * @java game/functions/ints/count/simple/CountVertices.java — eval(Context)
   * Returns context.game().board().topology().vertices().size()
   */
  public eval(ctx: Context & EvalScratch): number {
    // @java context.game().board().topology().vertices().size()
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (traj) {
      // Trajectories.vertexCount = core.topo.verts.length — the graph-level
      // vertex count regardless of play type, faithful to Java.
      return traj.vertexCount;
    }
    // Vertex-play board fallback: numSites is the vertex count.
    const g = ctx.game as unknown as { equipment?: { board?: { numSites?: number; width?: number; height?: number } } };
    // For a plain square grid, vertices = (W+1)*(H+1)
    const W = g.equipment?.board?.width ?? 0;
    const H = g.equipment?.board?.height ?? 0;
    if (W > 0 && H > 0) {
      return (W + 1) * (H + 1);
    }
    return 0;
  }
}

registerInt1to1("count:vertices", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  void _node; void _env;
  return new CountVertices1to1();
});

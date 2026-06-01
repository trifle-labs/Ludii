/**
 * IsCrossing1to1.ts
 * @java game/functions/booleans/is/edge/IsCrossing.java
 *
 * (is Crossing <edge1> <edge2>) — checks if two edges cross each other.
 *
 * Java eval:
 *   edge1 = edge1Fn.eval(context)
 *   edge2 = edge2Fn.eval(context)
 *   bounds check both against topology.edges().size()
 *   return topology.edges().get(edge1).doesCross(edge2)
 *
 * TS: Trajectories.edgeEndpointPts(site) gives [ax,ay,bx,by] for an edge site.
 * Uses the same open-segment intersection test as the interpreter-path IsCrossing.ts.
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction, BooleanFunction, EvalScratch } from "../../../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1 } from "../../../../../../compiler1to1.js";

export class IsCrossing1to1 implements BooleanFunction {
  private readonly edge1Fn: IntFunction;
  private readonly edge2Fn: IntFunction;

  public constructor(edge1Fn: IntFunction, edge2Fn: IntFunction) {
    this.edge1Fn = edge1Fn;
    this.edge2Fn = edge2Fn;
  }

  /**
   * @java game/functions/booleans/is/edge/IsCrossing.java — eval(Context)
   * Returns topology.edges().get(edge1).doesCross(edge2).
   * In TS: segment-intersection test on edge endpoint coordinates.
   */
  public eval(ctx: Context & EvalScratch): boolean {
    // @java edge1 = edge1Fn.eval(context); edge2 = edge2Fn.eval(context);
    const edge1 = this.edge1Fn.eval(ctx);
    const edge2 = this.edge2Fn.eval(ctx);
    if (edge1 < 0 || edge2 < 0) return false;

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (!traj) return false;

    // @java topology.edges().get(edge1).doesCross(edge2)
    // In TS: retrieve the (ax,ay,bx,by) for both edges via edgeEndpointPts.
    // For Edge-play boards, edgeEndpointPts works on play-site ids.
    // For Cell/Vertex-play boards, fall back to core edgeEls.
    const a = getEdgePts(traj, edge1);
    const b = getEdgePts(traj, edge2);
    if (!a || !b) return false;

    return segmentsCross(a[0], a[1], a[2], a[3], b[0], b[1], b[2], b[3]);
  }
}

/** Get edge endpoint coordinates [ax,ay,bx,by] from either Edge-play or Cell-play boards. */
function getEdgePts(
  traj: Trajectories,
  edgeIdx: number,
): readonly [number, number, number, number] | undefined {
  // Try Edge-play (edgeEndpointPts works directly on play-site ids).
  if (traj.kind === "Edge") {
    return traj.edgeEndpointPts(edgeIdx);
  }
  // Cell/Vertex-play: access core topology EdgeEl by graph edge index.
  const core = (traj as unknown as {
    core?: { topo?: { edgeEls?: Array<{
      va: { pt: { x: number; y: number } };
      vb: { pt: { x: number; y: number } };
    }> } }
  }).core;
  const edgeEls = core?.topo?.edgeEls;
  if (!edgeEls || edgeIdx >= edgeEls.length) return undefined;
  const e = edgeEls[edgeIdx];
  if (!e) return undefined;
  return [e.va.pt.x, e.va.pt.y, e.vb.pt.x, e.vb.pt.y];
}

/**
 * Open-segment intersection test, matching Ludii's MathRoutines.doesCross().
 * @java MathRoutines.java — doesCross() / Edge.doesCross()
 */
function segmentsCross(
  a0x: number, a0y: number, a1x: number, a1y: number,
  b0x: number, b0y: number, b1x: number, b1y: number,
): boolean {
  const EPSILON = 0.0000001;
  const MARGIN = 0.01;
  const xlk = a1x - a0x;
  const ylk = a1y - a0y;
  const xnm = b1x - b0x;
  const ynm = b1y - b0y;
  const xmk = b0x - a0x;
  const ymk = b0y - a0y;
  const det = xnm * ylk - ynm * xlk;
  if (Math.abs(det) < EPSILON) return false;
  const detinv = 1.0 / det;
  const s = (xnm * ymk - ynm * xmk) * detinv;
  const t = (xlk * ymk - ylk * xmk) * detinv;
  return s > MARGIN && s < 1 - MARGIN && t > MARGIN && t < 1 - MARGIN;
}

registerBool1to1("is:crossing", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  void _env;
  const { positional } = parseArgs1to1((node as LudList).items);
  // positional[0] = "Crossing" ident (matched by is:crossing key)
  // positional[1] = edge1 intFn, positional[2] = edge2 intFn
  const edge1Node = positional[1];
  const edge2Node = positional[2];

  const edge1Fn = edge1Node ? compileInt1to1(edge1Node) : { eval: (_c: Context) => -1 };
  const edge2Fn = edge2Node ? compileInt1to1(edge2Node) : { eval: (_c: Context) => -1 };

  return new IsCrossing1to1(edge1Fn, edge2Fn);
});

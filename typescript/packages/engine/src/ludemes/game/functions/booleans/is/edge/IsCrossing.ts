// @java Core/src/game/functions/booleans/is/edge/IsCrossing.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  type CompileEnv,
  LudemeCompileError,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type {
  BoolFn,
  EvalContext,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsCrossing(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  const edge1Node = positional[0];
  const edge2Node = positional[1];
  if (!edge1Node || !edge2Node) {
    throw new LudemeCompileError("(is Crossing <edge1> <edge2>) needs two edges.");
  }
  const edge1Fn = compileInt(edge1Node, env);
  const edge2Fn = compileInt(edge2Node, env);
  return {
    eval: (ctx) => {
      const edge1 = edge1Fn.eval(ctx);
      const edge2 = edge2Fn.eval(ctx);
      if (edge1 < 0 || edge2 < 0) return false;
      const a = edgeEndpointPts(ctx, edge1);
      const b = edgeEndpointPts(ctx, edge2);
      if (!a || !b) return false;
      // Java bounds-checks both edge ids, then delegates to Edge.doesCross().
      // @java IsCrossing.java:52-71
      return isCrossing(...a, ...b);
    },
  };
}

function edgeEndpointPts(
  ctx: EvalContext,
  edge: number,
): readonly [number, number, number, number] | undefined {
  const graphPts = ctx.board.traj?.edgeEndpointPts(edge);
  if (graphPts) return graphPts;

  const flatEdge = ctx.board.topo.edges[edge];
  if (!flatEdge) return undefined;
  const a = ctx.board.topo.vertices[flatEdge.a];
  const b = ctx.board.topo.vertices[flatEdge.b];
  if (!a || !b) return undefined;
  return [a.x, a.y, b.x, b.y];
}

// Same open-segment intersection test used by the region Crossing helper,
// matching Ludii's MathRoutines endpoint margin for "doesCross".
function isCrossing(
  a0x: number,
  a0y: number,
  a1x: number,
  a1y: number,
  b0x: number,
  b0y: number,
  b1x: number,
  b1y: number,
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

register("bool", "Crossing", compileIsCrossing as any);

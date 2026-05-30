// @java Core/src/game/functions/ints/iterator/Edge.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  LudemeCompileError,
  parseArgs,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import { OFF, type EvalContext, type IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileEdge(node: LudList, env: CompileEnv): IntFn {
  const { positional } = parseArgs(node.items.slice(1));
  if (positional.length === 0) {
    return {
      // @java Edge.java:86-87: with no vertex parameters, return context.edge().
      eval: (ctx) => (ctx.frame as { edge?: number }).edge ?? OFF,
    };
  }
  if (positional.length !== 2) {
    throw new LudemeCompileError("(edge ...) needs zero args or two vertices.");
  }

  const aFn = compileInt(positional[0]!, env);
  const bFn = compileInt(positional[1]!, env);
  return {
    // @java Edge.java:74-83: evaluate the two vertex ids, find the topology
    // edge joining them, and return its index, else Constants.OFF.
    eval: (ctx) => findEdge(ctx, aFn.eval(ctx), bFn.eval(ctx)),
  };
}

function findEdge(ctx: EvalContext, va: number, vb: number): number {
  if (va < 0 || vb < 0) return OFF;

  const edgeEls = ((ctx.board.traj as unknown as {
    core?: { topo?: { edgeEls?: readonly unknown[] } };
  })?.core?.topo?.edgeEls ?? []) as readonly {
    id: number;
    va: { id: number };
    vb: { id: number };
  }[];
  for (const edge of edgeEls) {
    if (
      (edge.va.id === va && edge.vb.id === vb) ||
      (edge.va.id === vb && edge.vb.id === va)
    ) {
      return edge.id;
    }
  }

  for (const edge of ctx.board.topo.edges) {
    if ((edge.a === va && edge.b === vb) || (edge.a === vb && edge.b === va)) {
      return edge.index;
    }
  }

  return OFF;
}

register("int", "edge", compileEdge as any);

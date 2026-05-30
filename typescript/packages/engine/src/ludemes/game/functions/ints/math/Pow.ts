// @java Core/src/game/functions/ints/math/Pow.java

import { type LudList } from "@ludii/typescript-language";
import { compileInt, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compilePow(node: LudList, env: CompileEnv): IntFn {
  const { positional } = parseArgs(node.items.slice(1));
  // (^ <base> <exp>) / (pow <base> <exp>) - integer power.
  const baseNode = positional[0];
  const expNode = positional[1];
  if (!baseNode || !expNode) return { eval: () => 0 };
  const baseFn = compileInt(baseNode, env);
  const expFn = compileInt(expNode, env);
  return {
    eval: (ctx) => Math.round(baseFn.eval(ctx) ** expFn.eval(ctx)),
  };
}

register("int", "pow", compilePow as any);
register("int", "^", compilePow as any);

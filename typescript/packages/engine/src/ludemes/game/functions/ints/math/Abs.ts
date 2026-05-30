// @java Core/src/game/functions/ints/math/Abs.java

import { type LudList } from "@ludii/typescript-language";
import { compileInt, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileAbs(node: LudList, env: CompileEnv): IntFn {
  const { positional } = parseArgs(node.items.slice(1));
  // (abs <int>) - absolute value.
  const inner = positional[0];
  if (!inner) return { eval: () => 0 };
  const fn = compileInt(inner, env);
  return { eval: (ctx) => Math.abs(fn.eval(ctx)) };
}

register("int", "abs", compileAbs as any);

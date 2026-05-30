// @java Core/src/game/functions/ints/iterator/To.java

import { type LudList } from "@ludii/typescript-language";
import { compileInt, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { OFF } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileTo(node: LudList, env: CompileEnv): IntFn {
  const { positional } = parseArgs(node.items.slice(1));
  if (positional.length === 0) {
    // @java To.java:58-62: return context.to().
    return { eval: (ctx) => ctx.frame.to ?? OFF };
  }
  // (to <siteExpr>) - destination wrapper used outside a move generator
  // (e.g. (set Rotation (to (last To)) ...)). Unwrap the inner expression.
  return compileInt(positional[0]!, env);
}

register("int", "to", compileTo as any);

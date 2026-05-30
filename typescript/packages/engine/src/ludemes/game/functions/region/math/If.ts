// @java Core/src/game/functions/region/math/If.java

import type { LudList } from "@ludii/typescript-language";
import {
  compileBool,
  compileRegion,
  type CompileEnv,
  LudemeCompileError,
  parseArgs,
} from "../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileRegionIf(node: LudList, env: CompileEnv): RegionFn {
  const { positional } = parseArgs(node.items.slice(1));
  // (if <bool> <regionThen> <regionElse>?) - pick a region by predicate.
  const condNode = positional[0];
  const thenNode = positional[1];
  if (!condNode || !thenNode)
    throw new LudemeCompileError("(if ...) region needs a cond and a then.");
  const cond = compileBool(condNode, env);
  const thenR = compileRegion(thenNode, env);
  const elseNode = positional[2];
  const elseR = elseNode ? compileRegion(elseNode, env) : undefined;
  return {
    eval: (ctx) =>
      cond.eval(ctx) ? thenR.eval(ctx) : elseR ? elseR.eval(ctx) : [],
  };
}

register("region", "if", compileRegionIf as any);

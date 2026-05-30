// @java Core/src/game/functions/intArray/math/If.java

import type { LudList } from "@ludii/typescript-language";
import {
  compileBool,
  compileRegion,
  type CompileEnv,
  parseArgs,
} from "../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileIf(node: LudList, env: CompileEnv): RegionFn {
  const { positional } = parseArgs(node.items.slice(1));
  const condNode = positional[0];
  const okNode = positional[1];
  if (!condNode || !okNode) return { eval: () => [] };

  const condition = compileBool(condNode, env);
  const ok = compileRegion(okNode, env);
  const notOkNode = positional[2];
  const notOk = notOkNode ? compileRegion(notOkNode, env) : undefined;

  return {
    eval: (ctx) =>
      // Java If.eval returns ok when condition is true, otherwise notOk; a
      // missing notOk is an empty IntArrayConstant (If.java:51-64).
      condition.eval(ctx) ? ok.eval(ctx) : notOk ? notOk.eval(ctx) : [],
  };
}

register("region", "if", compileIf as any);

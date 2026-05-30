// @java Core/src/game/functions/ints/count/value/CountValue.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  compileRegion,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { IntFn, RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileCountValue(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const valueNode = positional[1] ?? named.get("of");
  const arrayNode = named.get("in");
  const value: IntFn = valueNode ? compileInt(valueNode, env) : { eval: () => 0 };
  const array: RegionFn = arrayNode ? compileRegion(arrayNode, env) : { eval: () => [] as number[] };

  return {
    // Java CountValue.eval counts entries in arrayFn equal to valueFn
    // (Core/src/game/functions/ints/count/value/CountValue.java:47-59).
    eval: (ctx) => {
      const v = value.eval(ctx);
      let count = 0;
      for (const x of array.eval(ctx)) if (x === v) count += 1;
      return count;
    },
  };
}

register("int", "count:Value", compileCountValue as any);

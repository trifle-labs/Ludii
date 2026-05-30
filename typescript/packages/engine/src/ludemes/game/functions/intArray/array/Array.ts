// @java Core/src/game/functions/intArray/array/Array.java

import type { LudList } from "@ludii/typescript-language";
import {
  compileRegion,
  type CompileEnv,
  parseArgs,
} from "../../../../../eval/compile.js";
import {
  OFF,
  type IntFn,
} from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileArray(node: LudList, env: CompileEnv): IntFn {
  const { positional } = parseArgs(node.items.slice(1));
  // (array <region>) wraps a region as an IntArray. Used as an int operand
  // (e.g. inside (+ (array ...))), Java's Add sums the array - for a
  // one-element region this yields that single site index. Java:
  // game.functions.intArray.array.Array + Add's @Or IntArrayFunction arm.
  const inner = positional[0];
  if (!inner) return { eval: () => OFF };
  const region = compileRegion(inner, env);
  return {
    eval: (ctx) => {
      const sites = region.eval(ctx);
      if (sites.length === 0) return OFF;
      let sum = 0;
      for (const s of sites) sum += s;
      return sum;
    },
  };
}

register("int", "array", compileArray as any);

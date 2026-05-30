// @java Core/src/game/functions/intArray/math/Intersection.java

import { isList, type LudList } from "@ludii/typescript-language";
import {
  compileRegion,
  type CompileEnv,
  parseArgs,
} from "../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

function argNodes(node: LudList): readonly unknown[] {
  const { positional } = parseArgs(node.items.slice(1));
  const only = positional.length === 1 ? positional[0] : undefined;
  if (
    only &&
    isList(only) &&
    only.delimiter === "curly" &&
    only.items.every((item) => isList(item))
  ) {
    return only.items;
  }
  return positional;
}

export function compileIntersection(node: LudList, env: CompileEnv): RegionFn {
  const parts = argNodes(node).map((n) => compileRegion(n as any, env));
  return {
    eval: (ctx) => {
      // Java two-array constructor filters the second array by membership in
      // the first (Intersection.java:78-89). The many-array constructor starts
      // with the first array and removes values absent from each later array
      // (Intersection.java:91-108).
      if (parts.length === 0) return [];
      if (parts.length === 2) {
        const values1 = parts[0]!.eval(ctx);
        const values2 = [...parts[1]!.eval(ctx)];
        return values2.filter((value) => values1.includes(value));
      }
      let out = [...parts[0]!.eval(ctx)];
      for (let i = 1; i < parts.length; i += 1) {
        const values = parts[i]!.eval(ctx);
        out = out.filter((value) => values.includes(value));
      }
      return out;
    },
  };
}

register("region", "intersection", compileIntersection as any);

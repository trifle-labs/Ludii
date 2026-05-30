// @java Core/src/game/functions/intArray/math/Union.java

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

export function compileUnion(node: LudList, env: CompileEnv): RegionFn {
  const parts = argNodes(node).map((n) => compileRegion(n as any, env));
  return {
    eval: (ctx) => {
      // Java Union.eval starts with the first array and appends only values not
      // already present from later arrays, preserving first-array order and any
      // duplicates already in it (Union.java:73-109).
      if (parts.length === 0) return [];
      const out = [...parts[0]!.eval(ctx)];
      for (let i = 1; i < parts.length; i += 1) {
        for (const value of parts[i]!.eval(ctx)) {
          if (!out.includes(value)) out.push(value);
        }
      }
      return out;
    },
  };
}

register("region", "union", compileUnion as any);

// @java Core/src/game/functions/region/math/Intersection.java

import { isList, type LudList } from "@ludii/typescript-language";
import {
  compileRegion,
  type CompileEnv,
  parseArgs,
} from "../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileIntersection(node: LudList, env: CompileEnv): RegionFn {
  const { positional } = parseArgs(node.items.slice(1));
  const only = positional.length === 1 ? positional[0] : undefined;
  const grouped =
    only !== undefined &&
    isList(only) &&
    only.delimiter === "curly" &&
    only.items.every((n) => isList(n));
  const argNodes = grouped && only && isList(only) ? only.items : positional;
  const regions = argNodes.map((n) => compileRegion(n, env));

  return {
    eval: (ctx) => {
      // Intersection.eval returns empty for zero operands, otherwise intersects
      // the first region with each later region in order (Intersection.java:75-98).
      if (regions.length === 0) return [];
      const sets = regions.map((r) => new Set(r.eval(ctx)));
      const first = sets[0] ?? new Set<number>();
      return [...first].filter((site) => sets.every((set) => set.has(site)));
    },
  };
}

register("region", "intersection", compileIntersection as any);

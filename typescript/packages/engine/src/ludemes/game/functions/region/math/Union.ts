// @java Core/src/game/functions/region/math/Union.java

import { isList, type LudList } from "@ludii/typescript-language";
import {
  compileRegion,
  type CompileEnv,
  parseArgs,
} from "../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileUnion(node: LudList, env: CompileEnv): RegionFn {
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
      // Union.eval copies the first region, unions each remaining region, and
      // returns empty for a zero-length region array (Union.java:75-98).
      if (regions.length === 0) return [];
      const out = new Set<number>();
      for (const region of regions) {
        for (const site of region.eval(ctx)) out.add(site);
      }
      return [...out];
    },
  };
}

register("region", "union", compileUnion as any);

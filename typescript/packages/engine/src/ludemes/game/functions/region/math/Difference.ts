// @java Core/src/game/functions/region/math/Difference.java

import type { LudList } from "@ludii/typescript-language";
import {
  compileInt,
  compileRegion,
  type CompileEnv,
  parseArgs,
} from "../../../../../eval/compile.js";
import type { IntFn, RegionFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileDifference(node: LudList, env: CompileEnv): RegionFn {
  const { positional } = parseArgs(node.items.slice(1));
  const sourceNode = positional[0];
  if (!sourceNode) return { eval: () => [] };
  const source = compileRegion(sourceNode, env);
  const rest = positional.slice(1);

  const removals: Array<{ region?: RegionFn; site?: IntFn }> = [];
  for (const n of rest) {
    try {
      removals.push({ region: compileRegion(n, env) });
    } catch {
      removals.push({ site: compileInt(n, env) });
    }
  }

  return {
    eval: (ctx) => {
      // Difference.eval copies source, removes the subtraction region, or removes
      // one non-negative site when the IntFunction constructor arm is used
      // (Difference.java:71-90). The TS parser also accepts extra subtraction
      // operands as the legacy shared set-op did.
      const out = new Set(source.eval(ctx));
      for (const removal of removals) {
        if (removal.region) {
          for (const site of removal.region.eval(ctx)) out.delete(site);
        } else if (removal.site) {
          const site = removal.site.eval(ctx);
          if (site >= 0) out.delete(site);
        }
      }
      return [...out];
    },
  };
}

register("region", "difference", compileDifference as any);

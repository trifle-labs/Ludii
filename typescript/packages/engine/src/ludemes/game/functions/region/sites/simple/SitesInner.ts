// @java Core/src/game/functions/region/sites/simple/SitesInner.java

import type { LudList } from "@ludii/typescript-language";
import {
  allSites,
  outerSites,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileSitesInner(_node: LudList, _env: CompileEnv): RegionFn {
  return {
    eval: (ctx) => {
      const outer = new Set(outerSites(ctx));
      return allSites(ctx).filter((s) => !outer.has(s));
    },
  };
}

register("region", "Inner", compileSitesInner as any);

// @java Core/src/game/functions/region/sites/simple/SitesLastTo.java

import type { LudList } from "@ludii/typescript-language";
import {
  lastToSite,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileSitesLastTo(
  _node: LudList,
  _env: CompileEnv,
): RegionFn {
  return {
    eval: (ctx) => {
      const s = lastToSite(ctx);
      return s >= 0 ? [s] : [];
    },
  };
}

register("region", "LastTo", compileSitesLastTo as any);

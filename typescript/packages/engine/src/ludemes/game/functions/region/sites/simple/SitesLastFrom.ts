// @java Core/src/game/functions/region/sites/simple/SitesLastFrom.java

import type { LudList } from "@ludii/typescript-language";
import {
  lastFromSite,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileSitesLastFrom(
  _node: LudList,
  _env: CompileEnv,
): RegionFn {
  return {
    eval: (ctx) => {
      const s = lastFromSite(ctx);
      return s >= 0 ? [s] : [];
    },
  };
}

register("region", "LastFrom", compileSitesLastFrom as any);

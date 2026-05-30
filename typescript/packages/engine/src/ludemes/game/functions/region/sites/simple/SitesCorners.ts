// @java Core/src/game/functions/region/sites/simple/SitesCorners.java

import type { LudList } from "@ludii/typescript-language";
import {
  cornerSites,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileSitesCorners(
  _node: LudList,
  _env: CompileEnv,
): RegionFn {
  return { eval: (ctx) => cornerSites(ctx) };
}

register("region", "Corners", compileSitesCorners as any);

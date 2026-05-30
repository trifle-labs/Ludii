// @java Core/src/game/functions/region/sites/simple/SitesPerimeter.java

import type { LudList } from "@ludii/typescript-language";
import {
  outerSites,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileSitesPerimeter(
  _node: LudList,
  _env: CompileEnv,
): RegionFn {
  return { eval: (ctx) => outerSites(ctx) };
}

register("region", "Perimeter", compileSitesPerimeter as any);

// @java Core/src/game/functions/region/sites/simple/SitesBoard.java

import type { LudList } from "@ludii/typescript-language";
import {
  allSites,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileSitesBoard(_node: LudList, _env: CompileEnv): RegionFn {
  return { eval: (ctx) => allSites(ctx) };
}

register("region", "Board", compileSitesBoard as any);

// @java Core/src/game/functions/region/sites/hidden/SitesHidden.java

import type { LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileSitesHidden(
  _node: LudList,
  _env: CompileEnv,
): RegionFn {
  return { eval: () => [] };
}

register("region", "Hidden", compileSitesHidden as any);

// @java Core/src/game/functions/region/sites/simple/SitesToClear.java

import type { LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileSitesToClear(
  _node: LudList,
  _env: CompileEnv,
): RegionFn {
  return { eval: (ctx) => [...ctx.state.sitesToRemove] };
}

register("region", "ToClear", compileSitesToClear as any);

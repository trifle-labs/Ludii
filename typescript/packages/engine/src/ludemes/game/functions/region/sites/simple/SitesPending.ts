// @java Core/src/game/functions/region/sites/simple/SitesPending.java

import type { LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileSitesPending(
  _node: LudList,
  _env: CompileEnv,
): RegionFn {
  return { eval: (ctx) => [...ctx.state.pending] };
}

register("region", "Pending", compileSitesPending as any);

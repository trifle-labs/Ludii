// @java Core/src/game/functions/ints/iterator/Site.java

import { type LudList } from "@ludii/typescript-language";
import { type CompileEnv } from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { OFF } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileSite(_node: LudList, _env: CompileEnv): IntFn {
  // @java Site.java:34-38: return context.site(); EvalContext.java:40-41
  // initialises it to Constants.OFF.
  return { eval: (ctx) => ctx.frame.site ?? OFF };
}

register("int", "site", compileSite as any);

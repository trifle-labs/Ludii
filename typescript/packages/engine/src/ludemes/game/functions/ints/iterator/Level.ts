// @java Core/src/game/functions/ints/iterator/Level.java

import { type LudList } from "@ludii/typescript-language";
import { type CompileEnv } from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { OFF } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileLevel(_node: LudList, _env: CompileEnv): IntFn {
  // @java Level.java:36-40: return context.level(); EvalContext.java:22-23
  // initialises it to Constants.OFF until a stack iterator binds it.
  return { eval: (ctx) => ctx.frame.level ?? OFF };
}

register("int", "level", compileLevel as any);

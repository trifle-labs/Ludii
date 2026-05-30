// @java Core/src/game/functions/ints/iterator/Between.java

import { type LudList } from "@ludii/typescript-language";
import { type CompileEnv } from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { OFF } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileBetween(_node: LudList, _env: CompileEnv): IntFn {
  // @java Between.java:62-66: return context.between(); EvalContext defaults it
  // to Constants.OFF when no enclosing iterator has bound it.
  return { eval: (ctx) => ctx.frame.between ?? OFF };
}

register("int", "between", compileBetween as any);

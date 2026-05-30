// @java Core/src/game/functions/ints/iterator/Pips.java

import { type LudList } from "@ludii/typescript-language";
import { type CompileEnv } from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { OFF } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compilePips(_node: LudList, _env: CompileEnv): IntFn {
  // @java Pips.java:56-60: return context.pipCount(); the TS die iterator
  // carries that scratch value in frame.value and leaves it OFF when unbound.
  return { eval: (ctx) => ctx.frame.value ?? OFF };
}

register("int", "pips", compilePips as any);

// @java Core/src/game/functions/ints/state/Mover.java

import { type LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileMover(_node: LudList, _env: CompileEnv): IntFn {
  return { eval: (ctx) => ctx.mover };
}

register("int", "mover", compileMover as any);

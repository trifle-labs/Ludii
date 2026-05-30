// @java Core/src/game/functions/ints/count/simple/CountTurns.java

import type { LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../../eval/compile.js";
import type { IntFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileCountTurns(_node: LudList, _env: CompileEnv): IntFn {
  return {
    // Java CountTurns.eval returns context.state().numTurn()
    // (Core/src/game/functions/ints/count/simple/CountTurns.java:31-35).
    eval: (ctx) => ctx.state.numTurn,
  };
}

register("int", "count:Turns", compileCountTurns as any);

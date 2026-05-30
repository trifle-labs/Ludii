// @java Core/src/game/functions/ints/count/simple/CountMoves.java

import type { LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../../eval/compile.js";
import type { IntFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileCountMoves(_node: LudList, _env: CompileEnv): IntFn {
  return {
    // Java CountMoves.eval returns context.trial().moveNumber()
    // (Core/src/game/functions/ints/count/simple/CountMoves.java:31-35).
    eval: (ctx) => ctx.context.trial.numMoves,
  };
}

register("int", "count:Moves", compileCountMoves as any);

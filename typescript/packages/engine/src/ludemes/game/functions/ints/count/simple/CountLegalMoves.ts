// @java Core/src/game/functions/ints/count/simple/CountLegalMoves.java

import type { LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../../eval/compile.js";
import type { IntFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileCountLegalMoves(_node: LudList, _env: CompileEnv): IntFn {
  return {
    // Java CountLegalMoves.eval returns context.game().moves(context).moves().size()
    // (Core/src/game/functions/ints/count/simple/CountLegalMoves.java:31-35).
    eval: (ctx) => ctx.context.game.moves(ctx.context).length,
  };
}

register("int", "count:LegalMoves", compileCountLegalMoves as any);

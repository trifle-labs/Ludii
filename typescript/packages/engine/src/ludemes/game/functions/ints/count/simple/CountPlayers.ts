// @java Core/src/game/functions/ints/count/simple/CountPlayers.java

import type { LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../../eval/compile.js";
import type { IntFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileCountPlayers(_node: LudList, _env: CompileEnv): IntFn {
  return {
    // Java CountPlayers.eval returns context.game().players().count()
    // (Core/src/game/functions/ints/count/simple/CountPlayers.java:36-43).
    eval: (ctx) => ctx.context.game.numPlayers,
  };
}

register("int", "count:Players", compileCountPlayers as any);

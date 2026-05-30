// @java Core/src/game/functions/ints/count/simple/CountActive.java

import type { LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../../eval/compile.js";
import type { IntFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileCountActive(_node: LudList, _env: CompileEnv): IntFn {
  return {
    // Java CountActive.eval counts context.active(i) for players 1..size-1
    // (Core/src/game/functions/ints/count/simple/CountActive.java:32-40).
    // The TS state has no elimination/active mask yet, so every declared player
    // is active.
    eval: (ctx) => ctx.context.game.numPlayers,
  };
}

register("int", "count:Active", compileCountActive as any);

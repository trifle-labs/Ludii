// @java Core/src/game/functions/ints/card/simple/CardTrumpSuit.java

import type { LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../../eval/compile.js";
import type { IntFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileCardTrumpSuit(_node: LudList, _env: CompileEnv): IntFn {
  return {
    // Java CardTrumpSuit.eval returns context.state().trumpSuit()
    // (Core/src/game/functions/ints/card/simple/CardTrumpSuit.java:34-38).
    eval: (ctx) => ctx.state.trumpSuit,
  };
}

register("int", "card:TrumpSuit", compileCardTrumpSuit as any);

// @java Core/src/game/functions/booleans/all/simple/AllDiceEqual.java

import { type LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileAllDiceEqual(_node: LudList, _env: CompileEnv): BoolFn {
  // Java reads State.isDiceAllEqual(), which is updated by dice rolls
  // (AllDiceEqual.java:35-39).
  return { eval: (ctx) => ctx.state.diceAllEqual };
}

register("bool", "DiceEqual", compileAllDiceEqual as any);

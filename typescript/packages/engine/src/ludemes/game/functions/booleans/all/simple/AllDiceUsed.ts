// @java Core/src/game/functions/booleans/all/simple/AllDiceUsed.java

import { type LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileAllDiceUsed(_node: LudList, _env: CompileEnv): BoolFn {
  // Java returns true iff every currentDice entry is 0 (AllDiceUsed.java:36-47).
  return { eval: (ctx) => ctx.state.diceValues.every((v) => v === 0) };
}

register("bool", "DiceUsed", compileAllDiceUsed as any);

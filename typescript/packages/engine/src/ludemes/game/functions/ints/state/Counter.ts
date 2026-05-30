// @java Core/src/game/functions/ints/state/Counter.java

import { type LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileCounter(_node: LudList, _env: CompileEnv): IntFn {
  // (counter) → the game-level move counter (Java: State.counter()).
  return { eval: (ctx) => ctx.state.counter };
}

register("int", "counter", compileCounter as any);

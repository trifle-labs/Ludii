// @java Core/src/game/functions/booleans/is/simple/IsCycle.java

import { type LudList } from "@ludii/typescript-language";
import { type CompileEnv } from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsCycle(_node: LudList, _env: CompileEnv): BoolFn {
  // Java checks whether the latest player-count^2 state-hash window has
  // repeated twice before it. @java IsCycle.java:37-69
  return {
    eval: (ctx) => {
      const previousStates = ctx.context.trial.previousStates;
      const sizeCycle =
        ctx.context.game.numPlayers * ctx.context.game.numPlayers;
      if (previousStates.length < 3 * sizeCycle) return false;

      const lastStart = previousStates.length - sizeCycle;
      for (let offset = 0; offset < sizeCycle; offset += 1) {
        const want = previousStates[lastStart + offset];
        if (previousStates[lastStart - sizeCycle + offset] !== want)
          return false;
        if (previousStates[lastStart - 2 * sizeCycle + offset] !== want)
          return false;
      }
      return true;
    },
  };
}

register("bool", "Cycle", compileIsCycle as any);

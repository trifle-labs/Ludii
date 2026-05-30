// @java Core/src/game/functions/ints/state/Prev.java

import { type LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compilePrev(_node: LudList, _env: CompileEnv): IntFn {
  // (prev) — the player who made the most recent move (Java: Prev.java).
  // Falls back to the cyclic predecessor of the current mover before any
  // move has been made.
  return {
    eval: (ctx) => {
      const last = ctx.context.trial.lastMove();
      if (last) return last.mover;
      const n = ctx.context.game.numPlayers;
      return ((ctx.mover + n - 2) % n) + 1;
    },
  };
}

register("int", "prev", compilePrev as any);

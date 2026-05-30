// @java Core/src/game/functions/ints/state/Prev.java

import { isIdent, type LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compilePrev(_node: LudList, _env: CompileEnv): IntFn {
  const type = _node.items[1];
  const moverLastTurn = type && isIdent(type) && type.name === "MoverLastTurn";
  // Java Prev.eval: default PrevType.Mover returns state.prev(); the
  // MoverLastTurn arm calls trial.lastTurnMover(state.mover()).
  return {
    eval: (ctx) => {
      if (moverLastTurn) return ctx.context.trial.lastTurnMover(ctx.mover);
      const last = ctx.context.trial.lastMove();
      if (last) return last.mover;
      const n = ctx.context.game.numPlayers;
      return ((ctx.mover + n - 2) % n) + 1;
    },
  };
}

register("int", "prev", compilePrev as any);

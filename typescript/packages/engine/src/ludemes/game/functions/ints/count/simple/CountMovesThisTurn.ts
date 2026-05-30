// @java Core/src/game/functions/ints/count/simple/CountMovesThisTurn.java

import type { LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../../eval/compile.js";
import type { EvalContext, IntFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileCountMovesThisTurn(
  _node: LudList,
  _env: CompileEnv,
): IntFn {
  return {
    // Java CountMovesThisTurn.eval returns state.numTurnSamePlayer()
    // (Core/src/game/functions/ints/count/simple/CountMovesThisTurn.java:31-35).
    eval: (ctx) => movesThisTurn(ctx),
  };
}

function movesThisTurn(ctx: EvalContext): number {
  let n = 0;
  for (let i = ctx.context.trial.moves.length - 1; i >= 0; i -= 1) {
    if (ctx.context.trial.moves[i]?.mover === ctx.mover) n += 1;
    else break;
  }
  return n;
}

register("int", "count:MovesThisTurn", compileCountMovesThisTurn as any);

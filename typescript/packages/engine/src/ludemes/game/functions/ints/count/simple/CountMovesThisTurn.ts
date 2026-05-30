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
  return ctx.state.numTurnSamePlayer;
}

register("int", "count:MovesThisTurn", compileCountMovesThisTurn as any);

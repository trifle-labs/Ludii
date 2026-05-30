// @java Core/src/game/rules/play/moves/nonDecision/effect/set/player/SetScore.java

import { isIdent, type LudList } from "@ludii/typescript-language";
import { ActionSetScore } from "../../../../../../../../../action/action-set-score.js";
import {
  compileInt,
  postMoveContext,
  type CompileEnv,
  type EffectFn,
} from "../../../../../../../../../eval/compile.js";
import { register } from "../../../../../../../../registry.js";

export function compileSetScore(
  node: LudList,
  env: CompileEnv,
  inThen = false,
): EffectFn | undefined {
  // Moved verbatim from src/eval/compile.ts:12080.
  const who = node.items[2];
  const value = node.items[3];
  if (!who || !value) return undefined;
  const amount = compileInt(value, env);
  const roleName = isIdent(who) ? who.name : "";
  if (roleName === "All" || roleName === "Each") {
    // Java parity: `(set Score All v)` / `(set Score Each v)` sets every
    // player's score (pids 1..numPlayers). In a move `(then …)` the score
    // expression is evaluated on the post-move board: Ecosys recalculates
    // `(size Array (sizes Group ... Mover))` after the just-placed stone.
    return (ctx) => {
      const scoreCtx = inThen ? postMoveContext(ctx) : ctx;
      const n = ctx.context.game.numPlayers;
      const score = amount.eval(scoreCtx);
      const actions = [];
      for (let pid = 1; pid <= n; pid += 1) {
        actions.push(new ActionSetScore({ player: pid, score }));
      }
      return actions;
    };
  }
  const pid = compileInt(who, env);
  return (ctx) => {
    const scoreCtx = inThen ? postMoveContext(ctx) : ctx;
    return [
      new ActionSetScore({
        player: pid.eval(scoreCtx),
        score: amount.eval(scoreCtx),
      }),
    ];
  };
}

register("effect", "set:Score", compileSetScore as any);

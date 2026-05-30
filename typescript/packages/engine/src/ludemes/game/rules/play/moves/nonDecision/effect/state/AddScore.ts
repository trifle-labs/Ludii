// @java Core/src/game/rules/play/moves/nonDecision/effect/state/AddScore.java

import { isIdent, isList, type LudList } from "@ludii/typescript-language";
import { ActionSetScore } from "../../../../../../../../action/action-set-score.js";
import {
  compileInt,
  parseArgs,
  type CompileEnv,
  type EffectFn,
} from "../../../../../../../../eval/compile.js";
import { register } from "../../../../../../../registry.js";

export function compileAddScore(
  node: LudList,
  env: CompileEnv,
): EffectFn | undefined {
  const who = node.items[1];
  const value = node.items[2];
  if (!who || !value) return undefined;
  // Paired-list form: `(addScore {P1 P2 …} {v1 v2 …})` adds v_i to player_i
  // (Java AddScore with RoleType[]/IntFunction[]). OddEvenTree scores both
  // players in one step: `(addScore {P1 P2} {(cost …) (- 0 (cost …))})`.
  if (
    isList(who) &&
    who.delimiter === "curly" &&
    isList(value) &&
    value.delimiter === "curly"
  ) {
    const pidFns = who.items.map((p) => compileInt(p, env));
    const valFns = value.items.map((v) => compileInt(v, env));
    return (ctx) => {
      const actions = [];
      for (let i = 0; i < pidFns.length; i += 1) {
        const player = pidFns[i]?.eval(ctx) ?? 0;
        if (player < 1) continue;
        const vf = valFns[i] ?? valFns[valFns.length - 1];
        actions.push(
          new ActionSetScore({
            player,
            score: vf ? vf.eval(ctx) : 0,
            add: true,
          }),
        );
      }
      return actions;
    };
  }
  const amount = compileInt(value, env);
  const roleName = isIdent(who) ? who.name : "";
  if (roleName === "All" || roleName === "Each") {
    // Java parity: SetScore with RoleType.All/Each applies to every player
    // (pids 1..numPlayers), so emit one ActionSetScore each.
    return (ctx) => {
      const n = ctx.context.game.numPlayers;
      const delta = amount.eval(ctx);
      const actions = [];
      for (let pid = 1; pid <= n; pid += 1) {
        actions.push(new ActionSetScore({ player: pid, score: delta, add: true }));
      }
      return actions;
    };
  }
  const pid = compileInt(who, env);
  return (ctx) => [
    new ActionSetScore({
      player: pid.eval(ctx),
      score: amount.eval(ctx),
      add: true,
    }),
  ];
}

register("effect", "addScore", compileAddScore as any);

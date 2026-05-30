// @java Core/src/game/rules/play/moves/nonDecision/effect/set/nextPlayer/SetNextPlayer.java

import { type LudList } from "@ludii/typescript-language";
import { ActionSetNextPlayer } from "../../../../../../../../../action/action-set-next-player.js";
import {
  compileInt,
  type CompileEnv,
  type EffectFn,
} from "../../../../../../../../../eval/compile.js";
import { register } from "../../../../../../../../registry.js";

export function compileSetNextPlayer(
  node: LudList,
  env: CompileEnv,
): EffectFn | undefined {
  // Moved verbatim from src/eval/compile.ts:12266.
  // (set NextPlayer (player <n>)) — force the next mover.
  const arg = node.items[2];
  const fn = arg ? compileInt(arg, env) : undefined;
  return (ctx) => [new ActionSetNextPlayer(fn ? fn.eval(ctx) : ctx.mover)];
}

register("effect", "set:NextPlayer", compileSetNextPlayer as any);

// @java Core/src/game/rules/play/moves/nonDecision/effect/set/site/SetState.java

import { type LudList } from "@ludii/typescript-language";
import { ActionSetState } from "../../../../../../../../../action/action-set-state.js";
import {
  compileInt,
  parseArgs,
  type CompileEnv,
  type EffectFn,
} from "../../../../../../../../../eval/compile.js";
import { register } from "../../../../../../../../registry.js";

export function compileSetState(
  node: LudList,
  env: CompileEnv,
): EffectFn | undefined {
  // Moved verbatim from src/eval/compile.ts:12221.
  // (set State [at:<site>] <state> [<level>]) — per-site state layer.
  const { positional, named } = parseArgs(node.items.slice(2));
  const valFn = positional[0] ? compileInt(positional[0], env) : undefined;
  const atNode = named.get("at");
  const atFn = atNode ? compileInt(atNode, env) : undefined;
  return (ctx) => {
    const s = atFn ? atFn.eval(ctx) : (ctx.frame.to ?? 0);
    if (s < 0) return [];
    return [new ActionSetState({ to: s, state: valFn ? valFn.eval(ctx) : 0 })];
  };
}

register("effect", "set:State", compileSetState as any);

// @java Core/src/game/rules/play/moves/nonDecision/effect/set/site/SetValue.java

import { type LudList } from "@ludii/typescript-language";
import { ActionSetValue } from "../../../../../../../../../action/action-set-value.js";
import { ActionSetValueOfPlayer } from "../../../../../../../../../action/action-set-value-of-player.js";
import {
  compileInt,
  parseArgs,
  postMoveContext,
  type CompileEnv,
  type EffectFn,
} from "../../../../../../../../../eval/compile.js";
import { register } from "../../../../../../../../registry.js";

export function compileSetValue(
  node: LudList,
  env: CompileEnv,
  inThen = false,
): EffectFn | undefined {
  // Moved verbatim from src/eval/compile.ts:12233.
  // Two grammars: (set Value at:<site> <n>) → per-site value layer, and
  // (set Value <player> <n>) → per-player value.
  const { positional, named } = parseArgs(node.items.slice(2));
  const atNode = named.get("at");
  if (atNode) {
    const atFn = compileInt(atNode, env);
    const valFn = positional[0] ? compileInt(positional[0], env) : undefined;
    return (ctx) => {
      const valueCtx = inThen ? postMoveContext(ctx) : ctx;
      const s = atFn.eval(valueCtx);
      return s >= 0
        ? [
            new ActionSetValue({
              to: s,
              value: valFn ? valFn.eval(valueCtx) : 0,
            }),
          ]
        : [];
    };
  }
  const pidFn = positional[0] ? compileInt(positional[0], env) : undefined;
  const valFn = positional[1] ? compileInt(positional[1], env) : undefined;
  return (ctx) => {
    const valueCtx = inThen ? postMoveContext(ctx) : ctx;
    return [
      new ActionSetValueOfPlayer(
        pidFn ? pidFn.eval(valueCtx) : valueCtx.mover,
        valFn ? valFn.eval(valueCtx) : 0,
      ),
    ];
  };
}

register("effect", "set:Value", compileSetValue as any);

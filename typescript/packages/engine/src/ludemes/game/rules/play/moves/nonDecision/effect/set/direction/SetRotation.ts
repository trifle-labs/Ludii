// @java Core/src/game/rules/play/moves/nonDecision/effect/set/direction/SetRotation.java

import { type LudList } from "@ludii/typescript-language";
import { ActionSetRotation } from "../../../../../../../../../action/action-set-rotation.js";
import {
  compileInt,
  parseArgs,
  type CompileEnv,
  type EffectFn,
} from "../../../../../../../../../eval/compile.js";
import { register } from "../../../../../../../../registry.js";

export function compileSetRotation(
  node: LudList,
  env: CompileEnv,
): EffectFn | undefined {
  // Moved verbatim from src/eval/compile.ts:12272.
  const { positional, named } = parseArgs(node.items.slice(2));
  const valFn = positional[0] ? compileInt(positional[0], env) : undefined;
  const atNode = named.get("at");
  const atFn = atNode ? compileInt(atNode, env) : undefined;
  return (ctx) => {
    const s = atFn ? atFn.eval(ctx) : (ctx.frame.to ?? 0);
    if (s < 0) return [];
    return [
      new ActionSetRotation({
        to: s,
        rotation: valFn ? valFn.eval(ctx) : 0,
      }),
    ];
  };
}

register("effect", "set:Rotation", compileSetRotation as any);

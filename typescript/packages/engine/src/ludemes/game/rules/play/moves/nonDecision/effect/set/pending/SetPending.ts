// @java Core/src/game/rules/play/moves/nonDecision/effect/set/pending/SetPending.java

import { type LudList } from "@ludii/typescript-language";
import { ActionSetPending } from "../../../../../../../../../action/action-set-pending.js";
import {
  compileInt,
  compileRegion,
  isRegionNode,
  type CompileEnv,
  type EffectFn,
} from "../../../../../../../../../eval/compile.js";
import { register } from "../../../../../../../../registry.js";

export function compileSetPending(
  node: LudList,
  env: CompileEnv,
): EffectFn | undefined {
  // Moved verbatim from src/eval/compile.ts:12136.
  // `(set Pending)` marks the state pending (sentinel 1) so the next turn's
  // `(is Pending)` is true; `(set Pending <site>)` marks a specific site.
  const arg = node.items[2];
  if (arg && isRegionNode(arg)) {
    const regionFn = compileRegion(arg, env);
    return (ctx) =>
      regionFn
        .eval(ctx)
        .filter((site) => site >= 0)
        // @java Core/src/game/rules/play/moves/nonDecision/effect/set/pending/SetPending.java:80
        .map((site) => new ActionSetPending(site));
  }
  const siteFn = arg ? compileInt(arg, env) : undefined;
  return (ctx) => [
    new ActionSetPending(siteFn ? siteFn.eval(ctx) : 1),
  ];
}

register("effect", "set:Pending", compileSetPending as any);

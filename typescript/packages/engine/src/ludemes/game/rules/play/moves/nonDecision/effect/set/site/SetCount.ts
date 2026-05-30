// @java Core/src/game/rules/play/moves/nonDecision/effect/set/site/SetCount.java

import { type LudList } from "@ludii/typescript-language";
import { ActionSetCount } from "../../../../../../../../../action/action-set-count.js";
import {
  compileInt,
  compileRegion,
  parseArgs,
  type CompileEnv,
  type EffectFn,
} from "../../../../../../../../../eval/compile.js";
import { register } from "../../../../../../../../registry.js";

export function compileSetCount(
  node: LudList,
  env: CompileEnv,
): EffectFn | undefined {
  // Moved verbatim from src/eval/compile.ts:12154.
  // (set Count <n> [at:<site>] [to:<region>]) — the count at one site or
  // every site of a region (Java overwrites the per-site count layer).
  const { positional, named } = parseArgs(node.items.slice(2));
  const countFn = positional[0] ? compileInt(positional[0], env) : undefined;
  const atNode = named.get("at");
  const toNode = named.get("to");
  const atFn = atNode ? compileInt(atNode, env) : undefined;
  const toReg = toNode ? compileRegion(toNode, env) : undefined;
  return (ctx) => {
    const c = countFn ? countFn.eval(ctx) : 1;
    if (atFn) {
      const s = atFn.eval(ctx);
      return s >= 0 ? [new ActionSetCount({ to: s, count: c })] : [];
    }
    if (toReg) {
      return toReg
        .eval(ctx)
        .filter((s) => s >= 0)
        .map((s) => new ActionSetCount({ to: s, count: c }));
    }
    return [];
  };
}

register("effect", "set:Count", compileSetCount as any);

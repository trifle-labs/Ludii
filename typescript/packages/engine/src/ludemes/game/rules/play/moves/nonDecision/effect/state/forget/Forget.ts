// @java Core/src/game/rules/play/moves/nonDecision/effect/state/forget/Forget.java

import {
  isIdent,
  isString,
  type LudList,
  type LudNode,
} from "@ludii/typescript-language";
import { ActionForgetValue } from "../../../../../../../../../action/action-remember.js";
import {
  compileInt,
  parseArgs,
  type CompileEnv,
  type EffectFn,
} from "../../../../../../../../../eval/compile.js";
import { register } from "../../../../../../../../registry.js";

export function compileForget(
  node: LudList,
  env: CompileEnv,
): EffectFn | undefined {
  // `(forget Value <name>? <int>)` removes a value from the named remembered
  // list. The empty-string key is the unnamed (Java: rememberingValues) list.
  const sub = node.items[1];
  if (!sub || !isIdent(sub) || sub.name !== "Value") return undefined;
  const { positional } = parseArgs(node.items.slice(2));
  let idx = 0;
  let name = "";
  if (positional[idx] && isString(positional[idx] as LudNode)) {
    name = (positional[idx] as { value: string }).value;
    idx += 1;
  }
  const valNode = positional[idx];
  if (!valNode) return undefined;
  // `(forget Value [name?] All)` -> ForgetValueAll: clears the named list, or
  // (when no name) the unnamed list plus every named list. Java: ForgetValueAll.
  if (isIdent(valNode) && valNode.name === "All") {
    if (name) {
      return (ctx) =>
        ctx.state
          .rememberedFor(name)
          .map((v) => new ActionForgetValue(name, v));
    }
    return (ctx) => {
      const out: ActionForgetValue[] = [];
      for (const [key, vals] of ctx.state.remembered) {
        for (const v of vals) out.push(new ActionForgetValue(key, v));
      }
      return out;
    };
  }
  const valFn = compileInt(valNode, env);
  return (ctx) => [new ActionForgetValue(name, valFn.eval(ctx))];
}

register("effect", "forget", compileForget as any);

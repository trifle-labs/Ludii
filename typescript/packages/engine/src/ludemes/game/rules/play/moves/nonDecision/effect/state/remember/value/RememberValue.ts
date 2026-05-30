// @java Core/src/game/rules/play/moves/nonDecision/effect/state/remember/value/RememberValue.java

import {
  isIdent,
  isString,
  type LudList,
  type LudNode,
} from "@ludii/typescript-language";
import { ActionRememberValue } from "../../../../../../../../../../action/action-remember.js";
import {
  compileInt,
  parseArgs,
  type CompileEnv,
  type EffectFn,
} from "../../../../../../../../../../eval/compile.js";
import { register } from "../../../../../../../../../registry.js";

export function compileRememberValue(
  node: LudList,
  env: CompileEnv,
): EffectFn | undefined {
  // `(remember Value <name>? <int> [unique:True])` appends a value to the
  // named remembered list. The empty-string key is the unnamed (Java:
  // rememberingValues) list.
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
  const valFn = compileInt(valNode, env);
  return (ctx) => [new ActionRememberValue(name, valFn.eval(ctx))];
}

register("effect", "remember", compileRememberValue as any);

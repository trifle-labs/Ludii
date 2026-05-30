// @java Core/src/game/functions/booleans/math/If.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileBool,
  type CompileEnv,
  LudemeCompileError,
} from "../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileBoolIf(node: LudList, env: CompileEnv): BoolFn {
  const rest = node.items.slice(1);
  // (if <bool> <boolThen> [<boolElse>]) - predicate selector. The else
  // branch is optional; a missing else defaults to constant false (Java
  // returns false when the condition fails and no else is supplied).
  const condNode = rest[0];
  const thenNode = rest[1];
  const elseNode = rest[2];
  if (!condNode || !thenNode)
    throw new LudemeCompileError("(if ...) bool needs cond and then.");
  const cond = compileBool(condNode, env);
  const thenFn = compileBool(thenNode, env);
  const elseFn = elseNode
    ? compileBool(elseNode, env)
    : { eval: () => false };
  // Java evaluates only the selected branch; a missing else returns false
  // (If.java:55-65).
  return { eval: (ctx) => (cond.eval(ctx) ? thenFn : elseFn).eval(ctx) };
}

register("bool", "if", compileBoolIf as any);

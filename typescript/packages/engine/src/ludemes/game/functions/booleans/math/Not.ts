// @java Core/src/game/functions/booleans/math/Not.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileBool,
  type CompileEnv,
  LudemeCompileError,
} from "../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileNot(node: LudList, env: CompileEnv): BoolFn {
  const rest = node.items.slice(1);
  const arg = rest[0];
  if (!arg) throw new LudemeCompileError("(not ...) needs an argument.");
  const inner = compileBool(arg, env);
  // Java returns the negated child result after any static-cache check
  // (Not.java:43-50).
  return { eval: (ctx) => !inner.eval(ctx) };
}

register("bool", "not", compileNot as any);

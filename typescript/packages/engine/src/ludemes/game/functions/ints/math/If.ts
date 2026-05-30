// @java Core/src/game/functions/ints/math/If.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileBool,
  compileInt,
  parseArgs,
  type CompileEnv,
  LudemeCompileError,
} from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileIntIf(node: LudList, env: CompileEnv): IntFn {
  const { positional } = parseArgs(node.items.slice(1));
  // (if <bool> <intThen> <intElse>) - value selector.
  const condNode = positional[0];
  const thenNode = positional[1];
  const elseNode = positional[2];
  if (!condNode || !thenNode || !elseNode)
    throw new LudemeCompileError("(if ...) int needs cond, then, else.");
  const cond = compileBool(condNode, env);
  const thenFn = compileInt(thenNode, env);
  const elseFn = compileInt(elseNode, env);
  return { eval: (ctx) => (cond.eval(ctx) ? thenFn : elseFn).eval(ctx) };
}

register("int", "if", compileIntIf as any);

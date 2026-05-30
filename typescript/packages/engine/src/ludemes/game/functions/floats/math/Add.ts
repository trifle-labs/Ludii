// @java Core/src/game/functions/floats/math/Add.java

import {
  isIdent,
  isList,
  isNumber,
  listHead,
  type LudList,
  type LudNode,
} from "@ludii/typescript-language";
import {
  compileInt,
  LudemeCompileError,
  parseArgs,
  unwrapParens,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import type { EvalContext } from "../../../../../eval/eval-context.js";
import { lookupLudeme, register } from "../../../../registry.js";

export interface FloatFn {
  eval(ctx: EvalContext): number;
}

export function f32(value: number): number {
  return Math.fround(value);
}

export function compileFloatOperand(node: LudNode, env: CompileEnv): FloatFn {
  node = unwrapParens(node);
  if (isNumber(node)) {
    const value = f32(node.value);
    return { eval: () => value };
  }
  if (isList(node)) {
    const head = listHead(node);
    const registered = head ? lookupLudeme("float", head) : undefined;
    if (registered) return registered(node, env) as FloatFn;
  }
  if (isIdent(node) || isList(node)) {
    try {
      const intFn = compileInt(node, env);
      return { eval: (ctx) => f32(intFn.eval(ctx)) };
    } catch {
      // Keep the error below tied to the float compiler.
    }
  }
  throw new LudemeCompileError(`Cannot compile float from ${node.kind}.`);
}

export function compileFloatOperands(node: LudList, env: CompileEnv): FloatFn[] {
  const { positional } = parseArgs(node.items.slice(1));
  const first = positional[0];
  const rawArgs =
    positional.length === 1 &&
    first &&
    isList(first) &&
    first.delimiter === "curly"
      ? first.items
      : positional;
  return rawArgs.map((arg) => compileFloatOperand(arg, env));
}

export function compileAdd(node: LudList, env: CompileEnv): FloatFn {
  const args = compileFloatOperands(node, env);
  return {
    // Java Add.eval: binary `a + b` or list sum with a `float sum` accumulator.
    // Core/src/game/functions/floats/math/Add.java:68-80
    eval: (ctx) => {
      let sum = f32(0);
      for (const arg of args) sum = f32(sum + arg.eval(ctx));
      return sum;
    },
  };
}

register("float", "+", compileAdd as any);

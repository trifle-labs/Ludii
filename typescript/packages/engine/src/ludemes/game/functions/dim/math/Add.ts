// @java Core/src/game/functions/dim/math/Add.java

import {
  isList,
  isNumber,
  listHead,
  type LudList,
  type LudNode,
} from "@ludii/typescript-language";
import {
  LudemeCompileError,
  parseArgs,
  unwrapParens,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import { lookupLudeme, register } from "../../../../registry.js";

export interface DimFn {
  eval(): number;
}

export function toJavaInt(value: number): number {
  return value < 0 ? Math.ceil(value) : Math.floor(value);
}

export function compileDimOperand(node: LudNode, env: CompileEnv): DimFn {
  node = unwrapParens(node);
  if (isNumber(node)) {
    const value = toJavaInt(node.value);
    return { eval: () => value };
  }
  if (isList(node)) {
    const head = listHead(node);
    const registered = head ? lookupLudeme("dim", head) : undefined;
    if (registered) return registered(node, env) as DimFn;
  }
  throw new LudemeCompileError(`Cannot compile dim from ${node.kind}.`);
}

export function compileDimOperands(node: LudList, env: CompileEnv): DimFn[] {
  const { positional } = parseArgs(node.items.slice(1));
  const first = positional[0];
  const rawArgs =
    positional.length === 1 &&
    first &&
    isList(first) &&
    first.delimiter === "curly"
      ? first.items
      : positional;
  return rawArgs.map((arg) => compileDimOperand(arg, env));
}

export function compileAdd(node: LudList, env: CompileEnv): DimFn {
  const args = compileDimOperands(node, env);
  return {
    // Java Add.eval returns a+b or sums the DimFunction[] list.
    // Core/src/game/functions/dim/math/Add.java:67-80
    eval: () => {
      let sum = 0;
      for (const arg of args) sum += arg.eval();
      return sum;
    },
  };
}

register("dim", "+", compileAdd as any);

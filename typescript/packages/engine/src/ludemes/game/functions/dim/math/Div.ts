// @java Core/src/game/functions/dim/math/Div.java

import { type LudList } from "@ludii/typescript-language";
import { LudemeCompileError, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileDimOperand, toJavaInt, type DimFn } from "./Add.js";

export function compileDiv(node: LudList, env: CompileEnv): DimFn {
  const { positional } = parseArgs(node.items.slice(1));
  const leftNode = positional[0];
  const rightNode = positional[1];
  if (!leftNode || !rightNode)
    throw new LudemeCompileError("(/ ...) dim needs two values.");
  const left = compileDimOperand(leftNode, env);
  const right = compileDimOperand(rightNode, env);
  return {
    // Java Div.eval throws on zero divisor, then returns int division a / b.
    // Core/src/game/functions/dim/math/Div.java:47-55
    eval: () => {
      const b = right.eval();
      if (b === 0) throw new Error("Division by zero.");
      return toJavaInt(left.eval() / b);
    },
  };
}

register("dim", "/", compileDiv as any);

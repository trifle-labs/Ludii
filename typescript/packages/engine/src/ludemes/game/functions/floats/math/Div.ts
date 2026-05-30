// @java Core/src/game/functions/floats/math/Div.java

import { type LudList } from "@ludii/typescript-language";
import { LudemeCompileError, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileFloatOperand, f32, type FloatFn } from "./Add.js";

export function compileDiv(node: LudList, env: CompileEnv): FloatFn {
  const { positional } = parseArgs(node.items.slice(1));
  const leftNode = positional[0];
  const rightNode = positional[1];
  if (!leftNode || !rightNode)
    throw new LudemeCompileError("(/ ...) float needs two values.");
  const left = compileFloatOperand(leftNode, env);
  const right = compileFloatOperand(rightNode, env);
  return {
    // Java Div.eval throws on zero divisor, then returns a / b.
    // Core/src/game/functions/floats/math/Div.java:51-59
    eval: (ctx) => {
      const b = right.eval(ctx);
      if (b === 0) throw new Error("Division by zero.");
      return f32(left.eval(ctx) / b);
    },
  };
}

register("float", "/", compileDiv as any);

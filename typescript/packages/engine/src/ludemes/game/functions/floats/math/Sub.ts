// @java Core/src/game/functions/floats/math/Sub.java

import { type LudList } from "@ludii/typescript-language";
import { LudemeCompileError, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileFloatOperand, f32, type FloatFn } from "./Add.js";

export function compileSub(node: LudList, env: CompileEnv): FloatFn {
  const { positional } = parseArgs(node.items.slice(1));
  const leftNode = positional[0];
  const rightNode = positional[1];
  if (!leftNode || !rightNode)
    throw new LudemeCompileError("(- ...) float needs two values.");
  const left = compileFloatOperand(leftNode, env);
  const right = compileFloatOperand(rightNode, env);
  return {
    // Java Sub.eval returns valueA.eval(context) - valueB.eval(context).
    // Core/src/game/functions/floats/math/Sub.java:49-53
    eval: (ctx) => f32(left.eval(ctx) - right.eval(ctx)),
  };
}

register("float", "-", compileSub as any);

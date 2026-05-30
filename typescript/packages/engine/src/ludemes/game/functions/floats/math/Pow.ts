// @java Core/src/game/functions/floats/math/Pow.java

import { type LudList } from "@ludii/typescript-language";
import { LudemeCompileError, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileFloatOperand, f32, type FloatFn } from "./Add.js";

export function compilePow(node: LudList, env: CompileEnv): FloatFn {
  const { positional } = parseArgs(node.items.slice(1));
  const baseNode = positional[0];
  const expNode = positional[1];
  if (!baseNode || !expNode)
    throw new LudemeCompileError("(^ ...) float needs base and exponent.");
  const base = compileFloatOperand(baseNode, env);
  const exp = compileFloatOperand(expNode, env);
  return {
    // Java Pow.eval casts Math.pow(a,b) to float.
    // Core/src/game/functions/floats/math/Pow.java:49-53
    eval: (ctx) => f32(Math.pow(base.eval(ctx), exp.eval(ctx))),
  };
}

register("float", "pow", compilePow as any);
register("float", "^", compilePow as any);

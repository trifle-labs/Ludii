// @java Core/src/game/functions/floats/math/Cos.java

import { type LudList } from "@ludii/typescript-language";
import { LudemeCompileError, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileFloatOperand, f32, type FloatFn } from "./Add.js";

export function compileCos(node: LudList, env: CompileEnv): FloatFn {
  const { positional } = parseArgs(node.items.slice(1));
  const valueNode = positional[0];
  if (!valueNode) throw new LudemeCompileError("(cos ...) needs a value.");
  const value = compileFloatOperand(valueNode, env);
  return {
    // Java Cos.eval casts Math.cos(...) to float.
    // Core/src/game/functions/floats/math/Cos.java:38-42
    eval: (ctx) => f32(Math.cos(value.eval(ctx))),
  };
}

register("float", "cos", compileCos as any);

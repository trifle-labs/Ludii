// @java Core/src/game/functions/floats/math/Abs.java

import { type LudList } from "@ludii/typescript-language";
import { LudemeCompileError, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileFloatOperand, f32, type FloatFn } from "./Add.js";

export function compileAbs(node: LudList, env: CompileEnv): FloatFn {
  const { positional } = parseArgs(node.items.slice(1));
  const valueNode = positional[0];
  if (!valueNode) throw new LudemeCompileError("(abs ...) float needs a value.");
  const value = compileFloatOperand(valueNode, env);
  return {
    // Java Abs.eval returns Math.abs(value.eval(context)).
    // Core/src/game/functions/floats/math/Abs.java:43-47
    eval: (ctx) => f32(Math.abs(value.eval(ctx))),
  };
}

register("float", "abs", compileAbs as any);

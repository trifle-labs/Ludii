// @java Core/src/game/functions/floats/math/Exp.java

import { type LudList } from "@ludii/typescript-language";
import { LudemeCompileError, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileFloatOperand, f32, type FloatFn } from "./Add.js";

export function compileExp(node: LudList, env: CompileEnv): FloatFn {
  const { positional } = parseArgs(node.items.slice(1));
  const valueNode = positional[0];
  if (!valueNode) throw new LudemeCompileError("(exp ...) needs a value.");
  const value = compileFloatOperand(valueNode, env);
  return {
    // Java Exp.eval casts Math.exp(...) to float.
    // Core/src/game/functions/floats/math/Exp.java:38-42
    eval: (ctx) => f32(Math.exp(value.eval(ctx))),
  };
}

register("float", "exp", compileExp as any);

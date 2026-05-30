// @java Core/src/game/functions/floats/math/Tan.java

import { type LudList } from "@ludii/typescript-language";
import { LudemeCompileError, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileFloatOperand, f32, type FloatFn } from "./Add.js";

export function compileTan(node: LudList, env: CompileEnv): FloatFn {
  const { positional } = parseArgs(node.items.slice(1));
  const valueNode = positional[0];
  if (!valueNode) throw new LudemeCompileError("(tan ...) needs a value.");
  const value = compileFloatOperand(valueNode, env);
  return {
    // Java Tan.eval casts Math.tan(...) to float.
    // Core/src/game/functions/floats/math/Tan.java:38-42
    eval: (ctx) => f32(Math.tan(value.eval(ctx))),
  };
}

register("float", "tan", compileTan as any);

// @java Core/src/game/functions/floats/math/Sin.java

import { type LudList } from "@ludii/typescript-language";
import { LudemeCompileError, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileFloatOperand, f32, type FloatFn } from "./Add.js";

export function compileSin(node: LudList, env: CompileEnv): FloatFn {
  const { positional } = parseArgs(node.items.slice(1));
  const valueNode = positional[0];
  if (!valueNode) throw new LudemeCompileError("(sin ...) needs a value.");
  const value = compileFloatOperand(valueNode, env);
  return {
    // Java Sin.eval casts Math.sin(...) to float.
    // Core/src/game/functions/floats/math/Sin.java:38-42
    eval: (ctx) => f32(Math.sin(value.eval(ctx))),
  };
}

register("float", "sin", compileSin as any);

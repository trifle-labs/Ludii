// @java Core/src/game/functions/floats/math/Sqrt.java

import { type LudList } from "@ludii/typescript-language";
import { LudemeCompileError, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileFloatOperand, f32, type FloatFn } from "./Add.js";

export function compileSqrt(node: LudList, env: CompileEnv): FloatFn {
  const { positional } = parseArgs(node.items.slice(1));
  const valueNode = positional[0];
  if (!valueNode) throw new LudemeCompileError("(sqrt ...) needs a value.");
  const value = compileFloatOperand(valueNode, env);
  return {
    // Java Sqrt.eval rejects negatives, then casts Math.sqrt(...) to float.
    // Core/src/game/functions/floats/math/Sqrt.java:38-46
    eval: (ctx) => {
      const v = value.eval(ctx);
      if (v < 0) throw new Error("Sqrt of a negative value is undefined.");
      return f32(Math.sqrt(v));
    },
  };
}

register("float", "sqrt", compileSqrt as any);

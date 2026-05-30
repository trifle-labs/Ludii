// @java Core/src/game/functions/floats/math/Log10.java

import { type LudList } from "@ludii/typescript-language";
import { LudemeCompileError, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileFloatOperand, f32, type FloatFn } from "./Add.js";

export function compileLog10(node: LudList, env: CompileEnv): FloatFn {
  const { positional } = parseArgs(node.items.slice(1));
  const valueNode = positional[0];
  if (!valueNode) throw new LudemeCompileError("(log10 ...) needs a value.");
  const value = compileFloatOperand(valueNode, env);
  return {
    // Java Log10.eval rejects exactly zero, then casts Math.log10(...) to float.
    // Core/src/game/functions/floats/math/Log10.java:38-46
    eval: (ctx) => {
      const v = value.eval(ctx);
      if (v === 0) throw new Error("Logarithm 10 of zero is undefined.");
      return f32(Math.log10(v));
    },
  };
}

register("float", "log10", compileLog10 as any);

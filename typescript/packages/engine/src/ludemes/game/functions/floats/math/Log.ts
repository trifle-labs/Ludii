// @java Core/src/game/functions/floats/math/Log.java

import { type LudList } from "@ludii/typescript-language";
import { LudemeCompileError, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileFloatOperand, f32, type FloatFn } from "./Add.js";

export function compileLog(node: LudList, env: CompileEnv): FloatFn {
  const { positional } = parseArgs(node.items.slice(1));
  const valueNode = positional[0];
  if (!valueNode) throw new LudemeCompileError("(log ...) needs a value.");
  const value = compileFloatOperand(valueNode, env);
  return {
    // Java Log.eval rejects exactly zero, then casts Math.log(...) to float.
    // Core/src/game/functions/floats/math/Log.java:38-46
    eval: (ctx) => {
      const v = value.eval(ctx);
      if (v === 0) throw new Error("Logarithm of zero is undefined.");
      return f32(Math.log(v));
    },
  };
}

register("float", "log", compileLog as any);

// @java Core/src/game/functions/floats/math/Min.java

import { type LudList } from "@ludii/typescript-language";
import { LudemeCompileError, type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileFloatOperands, f32, type FloatFn } from "./Add.js";

export function compileMin(node: LudList, env: CompileEnv): FloatFn {
  const args = compileFloatOperands(node, env);
  if (args.length === 0) throw new LudemeCompileError("(min ...) float needs values.");
  return {
    // Java Min.eval uses Math.min(a,b) or folds a list from list[0].
    // Core/src/game/functions/floats/math/Min.java:66-79
    eval: (ctx) => {
      let min = args[0]!.eval(ctx);
      for (let i = 1; i < args.length; i += 1)
        min = f32(Math.min(min, args[i]!.eval(ctx)));
      return min;
    },
  };
}

register("float", "min", compileMin as any);

// @java Core/src/game/functions/floats/math/Max.java

import { type LudList } from "@ludii/typescript-language";
import { LudemeCompileError, type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileFloatOperands, f32, type FloatFn } from "./Add.js";

export function compileMax(node: LudList, env: CompileEnv): FloatFn {
  const args = compileFloatOperands(node, env);
  if (args.length === 0) throw new LudemeCompileError("(max ...) float needs values.");
  return {
    // Java Max.eval uses Math.max(a,b) or folds a list from list[0].
    // Core/src/game/functions/floats/math/Max.java:66-79
    eval: (ctx) => {
      let max = args[0]!.eval(ctx);
      for (let i = 1; i < args.length; i += 1)
        max = f32(Math.max(max, args[i]!.eval(ctx)));
      return max;
    },
  };
}

register("float", "max", compileMax as any);

// @java Core/src/game/functions/floats/math/Mul.java

import { type LudList } from "@ludii/typescript-language";
import { type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileFloatOperands, f32, type FloatFn } from "./Add.js";

export function compileMul(node: LudList, env: CompileEnv): FloatFn {
  const args = compileFloatOperands(node, env);
  return {
    // Java Mul.eval returns a*b or list product with a `float product`.
    // Core/src/game/functions/floats/math/Mul.java:68-81
    eval: (ctx) => {
      let product = f32(1);
      for (const arg of args) product = f32(product * arg.eval(ctx));
      return product;
    },
  };
}

register("float", "*", compileMul as any);
register("float", "mul", compileMul as any);

// @java Core/src/game/functions/dim/math/Mul.java

import { type LudList } from "@ludii/typescript-language";
import { type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileDimOperands, type DimFn } from "./Add.js";

export function compileMul(node: LudList, env: CompileEnv): DimFn {
  const args = compileDimOperands(node, env);
  return {
    // Java Mul.eval returns a*b or folds the list with `int mul = 1`.
    // Core/src/game/functions/dim/math/Mul.java:64-79
    eval: () => {
      let product = 1;
      for (const arg of args) product *= arg.eval();
      return product;
    },
  };
}

register("dim", "*", compileMul as any);
register("dim", "mul", compileMul as any);

// @java Core/src/game/functions/dim/math/Pow.java

import { type LudList } from "@ludii/typescript-language";
import { LudemeCompileError, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileDimOperand, toJavaInt, type DimFn } from "./Add.js";

export function compilePow(node: LudList, env: CompileEnv): DimFn {
  const { positional } = parseArgs(node.items.slice(1));
  const baseNode = positional[0];
  const expNode = positional[1];
  if (!baseNode || !expNode)
    throw new LudemeCompileError("(^ ...) dim needs base and exponent.");
  const base = compileDimOperand(baseNode, env);
  const exp = compileDimOperand(expNode, env);
  return {
    // Java Pow.eval casts Math.pow(a.eval(), b.eval()) to int.
    // Core/src/game/functions/dim/math/Pow.java:45-49
    eval: () => toJavaInt(Math.pow(base.eval(), exp.eval())),
  };
}

register("dim", "pow", compilePow as any);
register("dim", "^", compilePow as any);

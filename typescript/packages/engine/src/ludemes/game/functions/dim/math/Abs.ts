// @java Core/src/game/functions/dim/math/Abs.java

import { type LudList } from "@ludii/typescript-language";
import { LudemeCompileError, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileDimOperand, type DimFn } from "./Add.js";

export function compileAbs(node: LudList, env: CompileEnv): DimFn {
  const { positional } = parseArgs(node.items.slice(1));
  const valueNode = positional[0];
  if (!valueNode) throw new LudemeCompileError("(abs ...) dim needs a value.");
  const value = compileDimOperand(valueNode, env);
  return {
    // Java Abs.eval returns Math.abs(value.eval()).
    // Core/src/game/functions/dim/math/Abs.java:39-43
    eval: () => Math.abs(value.eval()),
  };
}

register("dim", "abs", compileAbs as any);

// @java Core/src/game/functions/dim/math/Min.java

import { type LudList } from "@ludii/typescript-language";
import { LudemeCompileError, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileDimOperand, type DimFn } from "./Add.js";

export function compileMin(node: LudList, env: CompileEnv): DimFn {
  const { positional } = parseArgs(node.items.slice(1));
  const leftNode = positional[0];
  const rightNode = positional[1];
  if (!leftNode || !rightNode)
    throw new LudemeCompileError("(min ...) dim needs two values.");
  const left = compileDimOperand(leftNode, env);
  const right = compileDimOperand(rightNode, env);
  return {
    // Java Min.eval returns Math.min(valueA.eval(), valueB.eval()).
    // Core/src/game/functions/dim/math/Min.java:42-46
    eval: () => Math.min(left.eval(), right.eval()),
  };
}

register("dim", "min", compileMin as any);

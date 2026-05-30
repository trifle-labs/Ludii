// @java Core/src/game/functions/dim/math/Max.java

import { type LudList } from "@ludii/typescript-language";
import { LudemeCompileError, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileDimOperand, type DimFn } from "./Add.js";

export function compileMax(node: LudList, env: CompileEnv): DimFn {
  const { positional } = parseArgs(node.items.slice(1));
  const leftNode = positional[0];
  const rightNode = positional[1];
  if (!leftNode || !rightNode)
    throw new LudemeCompileError("(max ...) dim needs two values.");
  const left = compileDimOperand(leftNode, env);
  const right = compileDimOperand(rightNode, env);
  return {
    // Java Max.eval returns Math.max(valueA.eval(), valueB.eval()).
    // Core/src/game/functions/dim/math/Max.java:42-46
    eval: () => Math.max(left.eval(), right.eval()),
  };
}

register("dim", "max", compileMax as any);

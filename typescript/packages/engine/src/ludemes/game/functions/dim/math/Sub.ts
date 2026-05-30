// @java Core/src/game/functions/dim/math/Sub.java

import { type LudList } from "@ludii/typescript-language";
import { LudemeCompileError, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import { register } from "../../../../registry.js";
import { compileDimOperand, type DimFn } from "./Add.js";

export function compileSub(node: LudList, env: CompileEnv): DimFn {
  const { positional } = parseArgs(node.items.slice(1));
  const leftNode = positional[0];
  const rightNode = positional[1];
  if (!leftNode || !rightNode)
    throw new LudemeCompileError("(- ...) dim needs two values.");
  const left = compileDimOperand(leftNode, env);
  const right = compileDimOperand(rightNode, env);
  return {
    // Java Sub.eval returns valueA.eval() - valueB.eval().
    // Core/src/game/functions/dim/math/Sub.java:44-48
    eval: () => left.eval() - right.eval(),
  };
}

register("dim", "-", compileSub as any);

// @java Core/src/game/functions/booleans/math/Xor.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileBool,
  type CompileEnv,
  LudemeCompileError,
} from "../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileXor(node: LudList, env: CompileEnv): BoolFn {
  const aNode = node.items[1];
  const bNode = node.items[2];
  if (!aNode || !bNode)
    throw new LudemeCompileError("(xor ...) needs two arguments.");
  const a = compileBool(aNode, env);
  const b = compileBool(bNode, env);
  // Java evaluates both operands, then returns exactly one true (Xor.java:55-66).
  return {
    eval: (ctx) => {
      const evalA = a.eval(ctx);
      const evalB = b.eval(ctx);
      return (evalA && !evalB) || (!evalA && evalB);
    },
  };
}

register("bool", "xor", compileXor as any);

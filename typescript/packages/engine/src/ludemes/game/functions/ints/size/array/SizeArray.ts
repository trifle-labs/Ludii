// @java Core/src/game/functions/ints/size/array/SizeArray.java

import type { LudList } from "@ludii/typescript-language";
import {
  compileRegion,
  LudemeCompileError,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { IntFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileSizeArray(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const arrayNode = positional[1] ?? named.get("array");
  if (!arrayNode) throw new LudemeCompileError("(size Array ...) needs an array.");
  const array = compileRegion(arrayNode, env);

  return {
    eval: (ctx) => {
      // Java SizeArray.eval evaluates the IntArrayFunction and returns its
      // length (Core/src/game/functions/ints/size/array/SizeArray.java:39-44).
      return array.eval(ctx).length;
    },
  };
}

register("int", "size:Array", compileSizeArray as any);

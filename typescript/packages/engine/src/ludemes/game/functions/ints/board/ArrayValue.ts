// @java Core/src/game/functions/ints/board/ArrayValue.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  compileRegion,
  parseArgs,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import { OFF, type IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileArrayValue(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  // (arrayValue <intArray> index:<n>) — the nth element of an int array
  // (e.g. (values Remembered "Name")). OFF when out of range.
  const arrNode = positional[0];
  const idxNode = named.get("index");
  if (!arrNode) return { eval: () => OFF };
  const arrFn = compileRegion(arrNode, env);
  const idxFn: IntFn = idxNode
    ? compileInt(idxNode, env)
    : { eval: () => 0 };
  return {
    eval: (ctx) => {
      const arr = arrFn.eval(ctx);
      const i = idxFn.eval(ctx);
      return i >= 0 && i < arr.length ? (arr[i] as number) : OFF;
    },
  };
}

register("int", "arrayValue", compileArrayValue as any);

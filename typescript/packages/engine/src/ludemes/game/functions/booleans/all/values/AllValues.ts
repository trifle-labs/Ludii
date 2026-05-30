// @java Core/src/game/functions/booleans/all/values/AllValues.java

import { isIdent, type LudList, type LudNode } from "@ludii/typescript-language";
import {
  compileBool,
  compileRegion,
  type CompileEnv,
  LudemeCompileError,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

function argsAfterSubtype(node: LudList): readonly LudNode[] {
  const head = node.items[0];
  return node.items.slice(head !== undefined && isIdent(head) && head.name === "all" ? 2 : 1);
}

export function compileAllValues(node: LudList, env: CompileEnv): BoolFn {
  const { positional, named } = parseArgs(argsAfterSubtype(node));
  const arrayNode = positional[0];
  if (!arrayNode)
    throw new LudemeCompileError("(all Values ...) needs an int array.");
  const ifNode = named.get("if") ?? named.get("If");
  if (!ifNode) throw new LudemeCompileError("(all Values ...) needs if:.");
  // In this TS engine, int-array ludemes are represented by RegionFn-shaped
  // numeric arrays (values/sizes/results/array).
  const array = compileRegion(arrayNode, env);
  const condition = compileBool(ifNode, env);

  // Java saves context.value(), rebinds it to each array entry, restores it,
  // and short-circuits false (AllValues.java:48-66).
  return {
    eval: (ctx) => {
      for (const value of array.eval(ctx)) {
        if (!condition.eval(ctx.withFrame({ value }))) return false;
      }
      return true;
    },
  };
}

register("bool", "Values", compileAllValues as any);

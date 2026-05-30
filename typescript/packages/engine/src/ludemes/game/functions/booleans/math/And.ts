// @java Core/src/game/functions/booleans/math/And.java

import {
  isList,
  type LudList,
  type LudNode,
  listHead,
} from "@ludii/typescript-language";
import {
  compileBool,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

function flattenBoolList(items: readonly LudNode[]): readonly LudNode[] {
  const only = items.length === 1 ? items[0] : undefined;
  if (
    only &&
    isList(only) &&
    (only.delimiter === "curly" || !listHead(only)) &&
    only.items.length >= 2
  ) {
    return only.items;
  }
  return items;
}

export function compileAnd(node: LudList, env: CompileEnv): BoolFn {
  // Java constructors store either the two operands or the whole array
  // unchanged (And.java:47-69); eval short-circuits false (And.java:74-85).
  const args = flattenBoolList(node.items.slice(1)).map((n) =>
    compileBool(n, env),
  );
  return { eval: (ctx) => args.every((a) => a.eval(ctx)) };
}

register("bool", "and", compileAnd as any);

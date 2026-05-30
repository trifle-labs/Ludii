// @java Core/src/game/functions/booleans/is/integer/IsEven.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  type CompileEnv,
  LudemeCompileError,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsEven(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  const kind: string = "Even";
  const valueNode = positional[0];
  if (!valueNode)
    throw new LudemeCompileError(`(is ${kind} <value>) needs a value.`);
  const value = compileInt(valueNode, env);
  const wantEven = kind === "Even";
  return {
    eval: (ctx) => {
      const v = value.eval(ctx);
      const isEven = ((v % 2) + 2) % 2 === 0;
      return wantEven ? isEven : !isEven;
    },
  };
}

register("bool", "Even", compileIsEven as any);

// @java Core/src/game/functions/ints/state/Var.java

import { isString, type LudList } from "@ludii/typescript-language";
import {
  LudemeCompileError,
  parseArgs,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileVar(node: LudList, _env: CompileEnv): IntFn {
  const { positional } = parseArgs(node.items.slice(1));
  // (var "name") → a named state variable; bare (var) → the global temp
  // value (Java: State.temp(), stored in TS at temps[0]).
  const nameNode = positional[0];
  if (nameNode && isString(nameNode)) {
    const varName = nameNode.value;
    return { eval: (ctx) => ctx.state.getVar(varName) };
  }
  if (!nameNode) return { eval: (ctx) => ctx.state.temp(0) };
  throw new LudemeCompileError('Unknown integer ludeme "var".');
}

register("int", "var", compileVar as any);

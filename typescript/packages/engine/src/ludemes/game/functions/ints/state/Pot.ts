// @java Core/src/game/functions/ints/state/Pot.java

import { type LudList } from "@ludii/typescript-language";
import {
  LudemeCompileError,
  parseArgs,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compilePot(node: LudList, _env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  if (positional.length !== 0 || named.size !== 0) {
    throw new LudemeCompileError("(pot) expects no arguments.");
  }
  // Java eval returns `context.state().pot()` directly (Pot.java:31-33).
  return { eval: (ctx) => ctx.state.pot };
}

register("int", "pot", compilePot as any);

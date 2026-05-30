// @java Core/src/game/functions/ints/iterator/Hint.java

import { isIdent, type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  parseArgs,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import { OFF, type IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileHint(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const atNode = named.get("at") ?? positional.find((p) => !isIdent(p));
  const atFn = atNode ? compileInt(atNode, env) : undefined;

  if (!atFn) {
    return {
      // @java Hint.java:57-60: no site argument returns context.hint().
      eval: (ctx) => (ctx.frame as { hint?: number }).hint ?? OFF,
    };
  }

  return {
    // @java Hint.java:63-90: with at:, look up the equipment hint whose first
    // region site equals the requested site. The TS engine has no parsed hint
    // equipment surface yet, so this preserves Java's missing-table result.
    eval: () => OFF,
  };
}

register("int", "hint", compileHint as any);

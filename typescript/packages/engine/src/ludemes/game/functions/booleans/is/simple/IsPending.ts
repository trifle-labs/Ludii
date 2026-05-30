// @java Core/src/game/functions/booleans/is/simple/IsPending.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  type CompileEnv,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsPending(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  // (is Pending) → the state carries a pending marker set by a previous
  // move's `(set Pending)`. (is Pending <site>) → that site is pending.
  const siteNode = positional[0];
  if (siteNode) {
    const site = compileInt(siteNode, env);
    return { eval: (ctx) => ctx.state.isPending(site.eval(ctx)) };
  }
  return { eval: (ctx) => ctx.state.pending.size > 0 };
}

register("bool", "Pending", compileIsPending as any);

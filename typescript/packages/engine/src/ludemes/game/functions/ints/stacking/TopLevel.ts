// @java Core/src/game/functions/ints/stacking/TopLevel.java

import { type LudList } from "@ludii/typescript-language";
import { compileInt, lastToSite, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { OFF } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileTopLevel(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  // (topLevel at:<site>) - index of the top piece in the stack at a site.
  const atNode = named.get("at") ?? positional[0];
  const siteFn = atNode ? compileInt(atNode, env) : undefined;
  return {
    eval: (ctx) => {
      const s = siteFn ? siteFn.eval(ctx) : lastToSite(ctx);
      if (s < 0) return 0;
      if (s >= ctx.state.cells.length) return OFF;
      const h = ctx.state.stackSize(s);
      return h > 0 ? h - 1 : 0;
    },
  };
}

register("int", "topLevel", compileTopLevel as any);

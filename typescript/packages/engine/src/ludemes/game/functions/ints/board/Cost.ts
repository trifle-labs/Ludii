// @java Core/src/game/functions/ints/board/Cost.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  compileRegion,
  parseArgs,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileCost(node: LudList, env: CompileEnv): IntFn {
  const { named } = parseArgs(node.items.slice(1));
  // (cost [<SiteType>] (at:<site> | in:<region>)) — sum of graph weights
  // over the resolved sites. @java game.functions.ints.board.Cost: the
  // optional leading SiteType is dropped (single graph-play type here); the
  // weights come from the `costAt` layer that `(set Cost …)` writes.
  const atNode = named.get("at");
  const inNode = named.get("in") ?? named.get("to");
  const atFn = atNode ? compileInt(atNode, env) : undefined;
  const inReg = inNode ? compileRegion(inNode, env) : undefined;
  if (!atFn && !inReg) return { eval: () => 0 };
  return {
    eval: (ctx) => {
      if (atFn) {
        const s = atFn.eval(ctx);
        return s >= 0 ? ctx.state.costAtSite(s) : 0;
      }
      let sum = 0;
      for (const s of inReg!.eval(ctx)) if (s >= 0) sum += ctx.state.costAtSite(s);
      return sum;
    },
  };
}

register("int", "cost", compileCost as any);

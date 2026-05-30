// @java Core/src/game/functions/booleans/is/component/IsFreedom.java

import { type LudList } from "@ludii/typescript-language";
import {
  aroundSites,
  compileInt,
  type CompileEnv,
  compileRegion,
  dropSiteType,
  LudemeCompileError,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsFreedom(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  const args = dropSiteType(positional);
  const regionNode = args[0];
  if (!regionNode) {
    throw new LudemeCompileError("(is Freedom <region> [toPlace]) needs a region.");
  }
  const region = compileRegion(regionNode, env);
  const locnNode = args[1];
  const locnFn = locnNode ? compileInt(locnNode, env) : undefined;
  return {
    eval: (ctx) => {
      const pid = locnFn ? locnFn.eval(ctx) : -1;
      const pivots = region.eval(ctx);
      // Java scans N/S/W/E trajectory steps from every pivot and succeeds on
      // the first base-layer empty neighbour that is not the pending placement.
      // @java IsFreedom.java:68-103
      for (const loc of pivots) {
        for (const neigh of aroundSites(ctx, loc, ["N", "S", "W", "E"])) {
          if (neigh === pid) continue;
          if (Math.abs(ctx.board.zOf(neigh)) > 0.001) continue;
          if (ctx.state.whatAtSite(neigh) === 0) return true;
        }
      }
      return false;
    },
  };
}

register("bool", "Freedom", compileIsFreedom as any);

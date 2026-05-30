// @java Core/src/game/functions/ints/count/site/CountSites.java

import { isString, type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  compileRegion,
  lastToSite,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { EvalContext, IntFn, RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileCountSites(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const inNode = named.get("in");
  const atNode = named.get("at");
  const nameNode = positional.find(isString);
  const region = inNode ? compileRegion(inNode, env) : undefined;
  const at = atNode ? compileInt(atNode, env) : undefined;

  return {
    eval: (ctx) => {
      // Java CountSites.eval returns container.numSites() when at/name selects a
      // container, else region.eval(context).length
      // (Core/src/game/functions/ints/count/site/CountSites.java:64-78).
      if (at || nameNode) return containerSiteCount(ctx, at);
      return regionOrLastTo(region, ctx).length;
    },
  };
}

function regionOrLastTo(region: RegionFn | undefined, ctx: EvalContext): readonly number[] {
  return region ? region.eval(ctx) : [lastToSite(ctx)].filter((s) => s >= 0);
}

function containerSiteCount(ctx: EvalContext, at: IntFn | undefined): number {
  const site = at?.eval(ctx);
  if (site !== undefined && site >= ctx.board.numSites) {
    for (let p = 1; p < ctx.board.handStart.length; p += 1) {
      const start = ctx.board.handStart[p] ?? -1;
      const size = ctx.board.handSizes[p] ?? 0;
      if (site >= start && site < start + size) return size;
    }
  }
  return ctx.board.numSites;
}

register("int", "count:Sites", compileCountSites as any);

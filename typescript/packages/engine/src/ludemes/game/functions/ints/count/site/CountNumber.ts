// @java Core/src/game/functions/ints/count/site/CountNumber.java

import { isIdent, type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  compileRegion,
  lastToSite,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { EvalContext, IntFn, RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileCountNumber(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const subtype = positional[0];
  const siteType = subtype && isIdent(subtype) ? subtype.name : env.boardDefaultSiteType ?? "Cell";
  const inNode = named.get("in");
  const atNode = named.get("at");
  const region = inNode ? compileRegion(inNode, env) : undefined;
  const at = atNode ? compileInt(atNode, env) : undefined;

  return {
    eval: (ctx) => {
      // Java CountNumber.eval sums sizeStack() for stacking games, otherwise
      // count(), over the IntArrayFromRegion sites
      // (Core/src/game/functions/ints/count/site/CountNumber.java:59-107).
      let count = 0;
      for (const site of regionOrAtOrLast(region, at, ctx)) {
        if (site < 0 || site >= ctx.state.cells.length) continue;
        if (!siteTypeMatches(ctx, env, siteType)) continue;
        if (env.isStacking) {
          count += ctx.state.stackSize(site);
        } else {
          const c = ctx.state.countAtSite(site);
          count += c > 0 ? c : ctx.state.isOccupiedSite(site) ? 1 : 0;
        }
      }
      return count;
    },
  };
}

function regionOrAtOrLast(
  region: RegionFn | undefined,
  at: IntFn | undefined,
  ctx: EvalContext,
): readonly number[] {
  if (region) return region.eval(ctx);
  if (at) return [at.eval(ctx)];
  return [lastToSite(ctx)];
}

function siteTypeMatches(ctx: EvalContext, env: CompileEnv, type: string): boolean {
  if (type === "Cell" || type === "Site") return true;
  return type === (env.boardDefaultSiteType ?? "Cell") && ctx.board.numSites > 0;
}

register("int", "count:Cell", compileCountNumber as any);
register("int", "count:Site", compileCountNumber as any);
register("int", "count:Vertex", compileCountNumber as any);
register("int", "count:Edge", compileCountNumber as any);

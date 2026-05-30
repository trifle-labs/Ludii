// @java Core/src/game/functions/ints/size/site/SizeStack.java

import type { LudList } from "@ludii/typescript-language";
import {
  compileInt,
  compileRegion,
  dropSiteType,
  lastToSite,
  LudemeCompileError,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type {
  EvalContext,
  IntFn,
  RegionFn,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileSizeStack(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const args = dropSiteType(positional.slice(1));
  const inNode = named.get("in");
  const atNode = named.get("at") ?? (inNode ? undefined : args[0]);
  if (inNode && atNode) {
    throw new LudemeCompileError(
      "(size Stack ...) accepts at most one in: region or at: site.",
    );
  }
  const region = inNode ? compileRegion(inNode, env) : undefined;
  const at = atNode ? compileInt(atNode, env) : undefined;

  return {
    eval: (ctx) => {
      // Java SizeStack constructs an IntArrayFromRegion from in:/at:/lastTo
      // (SizeStack.java:43-54), then sums BaseContainerStateStacking.sizeStack()
      // for every selected site (SizeStack.java:58-72).
      let count = 0;
      for (const site of selectedSites(ctx, region, at)) {
        if (site >= 0 && site < ctx.state.cells.length) {
          count += ctx.state.stackSize(site);
        }
      }
      return count;
    },
  };
}

function selectedSites(
  ctx: EvalContext,
  region: RegionFn | undefined,
  at: IntFn | undefined,
): readonly number[] {
  if (region) return region.eval(ctx);
  if (at) return [at.eval(ctx)];
  return [lastToSite(ctx)];
}

register("int", "size:Stack", compileSizeStack as any);

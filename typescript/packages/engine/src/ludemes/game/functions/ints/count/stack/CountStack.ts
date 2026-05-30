// @java Core/src/game/functions/ints/count/stack/CountStack.java

import { isIdent, type LudList } from "@ludii/typescript-language";
import {
  compileBool,
  compileInt,
  compileRegion,
  lastToSite,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { BoolFn, EvalContext, IntFn, RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileCountStack(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const fromTop = positional.some((p) => isIdent(p) && p.name === "FromTop");
  const toNode = named.get("to") ?? named.get("in");
  const atNode = named.get("at");
  const region = toNode ? compileRegion(toNode, env) : undefined;
  const at = atNode ? compileInt(atNode, env) : undefined;
  const ifNode = named.get("If") ?? named.get("if");
  const cond = ifNode ? compileBool(ifNode, env) : undefined;
  const stopNode = named.get("stop");
  const stop = stopNode ? compileBool(stopNode, env) : undefined;

  return {
    eval: (ctx) => {
      // Java CountStack.eval iterates each selected stack from bottom/top,
      // binding to and level, counting If until stop becomes true
      // (Core/src/game/functions/ints/count/stack/CountStack.java:79-143).
      let count = 0;
      for (const site of selectedSites(ctx, region, at)) {
        if (site < 0 || site >= ctx.state.cells.length || !ctx.state.isOccupiedSite(site)) continue;
        const top = ctx.state.stackSize(site) - 1;
        if (fromTop) {
          for (let level = top; level >= 0; level -= 1) {
            const sub = ctx.withFrame({ to: site, level });
            if (stop?.eval(sub)) break;
            if (!cond || cond.eval(sub)) count += 1;
          }
        } else {
          for (let level = 0; level <= top; level += 1) {
            const sub = ctx.withFrame({ to: site, level });
            if (stop?.eval(sub)) break;
            if (!cond || cond.eval(sub)) count += 1;
          }
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

register("int", "count:Stack", compileCountStack as any);

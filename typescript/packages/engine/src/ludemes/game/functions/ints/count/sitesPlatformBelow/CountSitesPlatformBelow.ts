// @java Core/src/game/functions/ints/count/sitesPlatformBelow/CountSitesPlatformBelow.java

import { isIdent, isList, type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  parseArgs,
  resolveRole,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import { type EvalContext, type IntFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileCountSitesPlatformBelow(
  node: LudList,
  env: CompileEnv,
): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const atNode = named.get("at");
  const siteFn = atNode ? compileInt(atNode, env) : undefined;
  const whatNode = named.get("what");
  const whatFns: IntFn[] =
    whatNode !== undefined
      ? [compileInt(whatNode, env)]
      : named.get("whats") && isList(named.get("whats")!)
        ? (named.get("whats") as LudList).items.map((n) => compileInt(n, env))
        : [];
  const whoNode = named.get("who");
  const whoFn: IntFn | undefined = whoNode
    ? isIdent(whoNode)
      ? { eval: (ctx: EvalContext) => resolveRole(whoNode.name, ctx) }
      : compileInt(whoNode, env)
    : undefined;

  return {
    eval: (ctx) => {
      // @java CountSitesPlatformBelow.java:88-130
      // Java follows Downward trajectories from the target vertex and counts
      // supporting sites matching `what(s)` or `who`. The TS graph stores the
      // Shibumi pyramid geometrically, so recover the four supports one layer
      // below at x/y offsets of 0.5, matching the existing IsFlat port.
      const site = siteFn ? siteFn.eval(ctx) : ctx.frame.to ?? -1;
      if (site < 0 || site >= ctx.board.numSites) return -1;
      const DZ = 1 / Math.SQRT2;
      const TOL = 0.01;
      const layer = Math.round(ctx.board.zOf(site) / DZ);
      if (layer === 0) return 0;
      const sx = ctx.board.xOf(site);
      const sy = ctx.board.yOf(site);
      const targetZ = (layer - 1) * DZ;
      const whats = new Set(whatFns.map((fn) => fn.eval(ctx)));
      const who = whoFn ? whoFn.eval(ctx) : undefined;
      let count = 0;
      for (let s = 0; s < ctx.board.numSites; s += 1) {
        if (Math.abs(ctx.board.zOf(s) - targetZ) > TOL) continue;
        const dx = Math.abs(ctx.board.xOf(s) - sx);
        const dy = Math.abs(ctx.board.yOf(s) - sy);
        if (Math.abs(dx - 0.5) > TOL || Math.abs(dy - 0.5) > TOL) continue;
        if (whats.size > 0) {
          if (whats.has(ctx.state.whatAtSite(s))) count += 1;
        } else if (who !== undefined) {
          if ((ctx.state.cells[s] ?? 0) === who) count += 1;
        }
      }
      return count;
    },
  };
}

register("int", "count:SitesPlatformBelow", compileCountSitesPlatformBelow as any);

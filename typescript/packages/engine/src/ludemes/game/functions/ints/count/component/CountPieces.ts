// @java Core/src/game/functions/ints/count/component/CountPieces.java

import { isIdent, isString, type LudList } from "@ludii/typescript-language";
import {
  compileBool,
  compileInt,
  compileRegion,
  parseArgs,
  resolveRole,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { BoolFn, EvalContext, IntFn, RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

const SITE_TYPES = new Set(["Cell", "Vertex", "Edge"]);

export function compileCountPieces(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  let index = 1;
  const typeNode = positional[index];
  if (typeNode && isIdent(typeNode) && SITE_TYPES.has(typeNode.name)) index += 1;
  const roleNode = positional[index];
  const ofNode = named.get("of");
  const nameNode = positional.find(isString);
  const name = nameNode?.value;
  const roleName = roleNode && isIdent(roleNode) && !SITE_TYPES.has(roleNode.name) ? roleNode.name : undefined;
  const whoFn = ofNode ? compileInt(ofNode, env) : undefined;
  const inNode = named.get("in");
  const region = inNode ? compileRegion(inNode, env) : undefined;
  const ifNode = named.get("If") ?? named.get("if");
  const cond = ifNode ? compileBool(ifNode, env) : undefined;

  return {
    eval: (ctx) => {
      // Java CountPieces.eval resolves role/of, optional region, optional
      // component-name contains(), then counts matching stack levels or flat
      // site counts while binding site/level for If (CountPieces.java:84-200).
      if (name === "Bag") return 0; // TODO: needs remainingDominoes state.
      const players = playerSet(ctx, env, roleName, whoFn);
      const sites = region ? region.eval(ctx) : Array.from({ length: ctx.state.cells.length }, (_, i) => i);
      let count = 0;
      for (const site of sites) {
        if (site < 0 || site >= ctx.state.cells.length) continue;
        if (!ctx.state.isOccupiedSite(site)) continue;
        if (env.isStacking) {
          const size = ctx.state.stackSize(site);
          for (let level = 0; level < size; level += 1) {
            const who = ctx.state.whoAtSiteLevel(site, level);
            if (!matchesPlayer(players, who, ctx, site)) continue;
            const what = ctx.state.whatAtSiteLevel(site, level);
            if (!matchesName(env, what, name)) continue;
            if (!cond || cond.eval(ctx.withFrame({ site, level }))) count += 1;
          }
        } else {
          const who = ctx.state.cells[site] ?? 0;
          if (!matchesPlayer(players, who, ctx, site)) continue;
          const what = ctx.state.whatAtSite(site);
          if (!matchesName(env, what, name)) continue;
          if (!cond || cond.eval(ctx.withFrame({ site }))) {
            count += Math.max(1, ctx.state.countAtSite(site));
          }
        }
      }
      return count;
    },
  };
}

function playerSet(
  ctx: EvalContext,
  env: CompileEnv,
  roleName: string | undefined,
  whoFn: IntFn | undefined,
): Set<number> | "all" {
  if (!roleName && !whoFn) return "all";
  if (roleName === "All" || roleName === "Each") return "all";
  if (roleName === "Enemy") {
    const out = new Set<number>();
    for (let p = 1; p <= env.numPlayers; p += 1) if (p !== ctx.mover) out.add(p);
    return out;
  }
  if (roleName === "Neutral" || roleName === "Shared") return new Set([0, env.numPlayers + 1]);
  return new Set([whoFn ? whoFn.eval(ctx) : resolveRole(roleName ?? "Mover", ctx)]);
}

function matchesPlayer(players: Set<number> | "all", who: number, ctx: EvalContext, site: number): boolean {
  if (players === "all") return ctx.state.isOccupiedSite(site);
  return players.has(who);
}

function matchesName(env: CompileEnv, what: number, name: string | undefined): boolean {
  if (!name) return true;
  const base = env.componentBaseNameById?.[what] ?? "";
  return base.includes(name);
}

register("int", "count:Pieces", compileCountPieces as any);

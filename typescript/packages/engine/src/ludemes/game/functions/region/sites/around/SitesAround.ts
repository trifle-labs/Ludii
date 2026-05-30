// @java Core/src/game/functions/region/sites/around/SitesAround.java

import {
  isIdent,
  isList,
  type LudList,
  type LudNode,
} from "@ludii/typescript-language";
import {
  aroundSites,
  compileBool,
  compileInt,
  compileSiteOrRegion,
  dropSiteType,
  type CompileEnv,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { BoolFn, EvalContext, RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

const REGION_TYPE_DYNAMIC = new Set([
  "Empty",
  "NotEmpty",
  "Own",
  "NotOwn",
  "Enemy",
  "NotEnemy",
]);

function directionTokens(node: LudNode | undefined): string[] {
  if (!node) return [];
  if (isIdent(node)) return node.name === "~" ? [] : [node.name];
  if (isList(node)) {
    const head = node.items[0];
    const items = head !== undefined && isIdent(head) && head.name === "directions"
      ? node.items.slice(1)
      : node.items;
    const out: string[] = [];
    for (const item of items) {
      if (isIdent(item) && item.name !== "~" && !item.name.endsWith(":")) {
        out.push(item.name);
      } else if (isList(item)) {
        for (const inner of item.items) {
          if (isIdent(inner) && inner.name !== "~") out.push(inner.name);
        }
      }
    }
    return out;
  }
  return [];
}

function isTrue(node: LudNode | undefined): boolean {
  return !!node && isIdent(node) && node.name === "True";
}

function sitesAtDistance(
  ctx: EvalContext,
  from: number,
  dirs: readonly string[],
  distance: number,
): number[] {
  if (distance <= 1) return aroundSites(ctx, from, dirs);
  const out: number[] = [];
  const first = aroundSites(ctx, from, dirs);
  const ox = ctx.board.xOf(from);
  const oy = ctx.board.yOf(from);
  for (const n of first) {
    const dx = ctx.board.xOf(n) - ox;
    const dy = ctx.board.yOf(n) - oy;
    let x = ctx.board.xOf(n);
    let y = ctx.board.yOf(n);
    let site = n;
    for (let step = 1; step < distance; step += 1) {
      x += dx;
      y += dy;
      site = ctx.board.siteAt(x, y);
      if (site < 0) break;
    }
    if (site >= 0) out.push(site);
  }
  return out;
}

function dynamicFilter(
  token: string | undefined,
  env: CompileEnv,
): ((site: number, ctx: EvalContext) => boolean) | undefined {
  if (!token) return undefined;
  const ownerById = env.componentOwnerById;
  const shared = env.numPlayers + 1;
  const ownerAt = (site: number, ctx: EvalContext): number => {
    const what = ctx.state.whatAtSite(site);
    if (what <= 0) return -1;
    return ownerById?.[what] ?? 0;
  };
  switch (token) {
    case "Empty":
      return (s, ctx) => ctx.state.isEmptySite(s);
    case "NotEmpty":
      return (s, ctx) => ctx.state.isOccupiedSite(s);
    case "Own":
    case "NotEnemy":
      return (s, ctx) => {
        const owner = ownerAt(s, ctx);
        return owner >= 0 && (owner === ctx.mover || owner === shared);
      };
    case "Enemy":
      return (s, ctx) => {
        const owner = ownerAt(s, ctx);
        return owner > 0 && owner !== ctx.mover && owner < shared;
      };
    case "NotOwn":
      return (s, ctx) => {
        const owner = ownerAt(s, ctx);
        return owner >= 0 && owner !== ctx.mover && owner !== shared;
      };
    default:
      return undefined;
  }
}

export function compileSitesAround(node: LudList, env: CompileEnv): RegionFn {
  const { positional, named } = parseArgs(node.items.slice(2));
  const pos = dropSiteType(positional);
  const whereNode = pos[0];
  if (!whereNode) return { eval: () => [] };
  const where = compileSiteOrRegion(whereNode, env);

  let typeToken: string | undefined;
  const dirs: string[] = [];
  for (const item of pos.slice(1)) {
    if (isIdent(item) && REGION_TYPE_DYNAMIC.has(item.name)) {
      typeToken = item.name;
      continue;
    }
    dirs.push(...directionTokens(item));
  }
  const typeFilter = dynamicFilter(typeToken, env);
  const condNode = named.get("if") ?? named.get("If");
  const cond: BoolFn | undefined = condNode ? compileBool(condNode, env) : undefined;
  const includeSelf = isTrue(named.get("includeSelf"));
  const distanceNode = named.get("distance");
  const distance = distanceNode ? compileInt(distanceNode, env) : { eval: () => 1 };

  return {
    eval: (ctx) => {
      // SitesAround.eval evaluates origin sites, returns empty for an empty
      // region or first UNDEFINED site, binds from/to while testing each
      // candidate, and applies includeSelf after scanning (SitesAround.java:105-190).
      const sites = where.eval(ctx);
      if (sites.length === 0 || sites[0] === -1) return [];
      const origins = new Set(sites);
      const out: number[] = [];
      const seen = new Set<number>();
      const dist = distance.eval(ctx);
      for (const site of sites) {
        if (site < 0) continue;
        for (const to of sitesAtDistance(ctx, site, dirs, dist)) {
          if (seen.has(to)) continue;
          if (typeFilter && !typeFilter(to, ctx)) continue;
          if (cond && !cond.eval(ctx.withFrame({ from: site, to }))) continue;
          seen.add(to);
          out.push(to);
        }
      }
      if (includeSelf) {
        for (const site of sites) {
          if (!seen.has(site)) {
            seen.add(site);
            out.push(site);
          }
        }
      } else {
        for (let i = out.length - 1; i >= 0; i -= 1) {
          if (origins.has(out[i] as number)) out.splice(i, 1);
        }
      }
      return out;
    },
  };
}

register("region", "sites:Around", compileSitesAround as any);

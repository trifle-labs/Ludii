// @java Core/src/game/functions/region/sites/direction/SitesDirection.java

import { isIdent, isList, type LudList, type LudNode } from "@ludii/typescript-language";
import {
  compileBool,
  compileDirections,
  compileInt,
  compileSiteOrRegion,
  dropSiteType,
  type CompileEnv,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { BoolFn, Dir, RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

function isTrue(node: LudNode | undefined): boolean {
  return !!node && isIdent(node) && node.name === "True";
}

function directionNode(nodes: readonly LudNode[]): LudNode | undefined {
  return nodes.find((n) => isIdent(n) || isList(n));
}

function ray(
  ctx: Parameters<RegionFn["eval"]>[0],
  from: number,
  dir: Dir,
  distance: number,
): number[] {
  const out: number[] = [];
  let x = ctx.board.xOf(from);
  let y = ctx.board.yOf(from);
  for (let i = 0; i < distance; i += 1) {
    x += dir.dx;
    y += dir.dy;
    const site = ctx.board.siteAt(x, y);
    if (site < 0) break;
    out.push(site);
  }
  return out;
}

export function compileSitesDirection(node: LudList, env: CompileEnv): RegionFn {
  const { positional, named } = parseArgs(node.items.slice(2));
  const pos = dropSiteType(positional);
  const fromNode = named.get("from") ?? named.get("From") ?? pos[0];
  if (!fromNode) return { eval: () => [] };
  const fromRegion = compileSiteOrRegion(fromNode, env);
  const dirSpec = directionNode(pos.filter((p) => p !== fromNode));
  const dirs = dirSpec ? compileDirections(dirSpec, env) : compileDirections({ kind: "ident", name: "Adjacent" } as LudNode, env);
  const included = named.has("included")
    ? compileBool(named.get("included") as LudNode, env)
    : { eval: () => false };
  const stopRule: BoolFn = named.has("stop")
    ? compileBool(named.get("stop") as LudNode, env)
    : { eval: () => false };
  const stopIncluded: BoolFn = named.has("stopIncluded")
    ? compileBool(named.get("stopIncluded") as LudNode, env)
    : { eval: () => false };
  const distance = named.has("distance")
    ? compileInt(named.get("distance") as LudNode, env)
    : { eval: () => Number.MAX_SAFE_INTEGER };

  return {
    eval: (ctx) => {
      // SitesDirection.eval evaluates every origin, optionally includes it,
      // binds context.to for each radial step, stops a direction when stop is
      // true, and restores the original to afterwards (SitesDirection.java:105-156).
      const origins = fromRegion.eval(ctx);
      const out: number[] = [];
      for (const loc of origins) {
        if (loc === -1) return out;
        if (loc < 0) continue;
        const base = ctx.withFrame({ from: loc });
        if (isTrue(named.get("included")) || included.eval(base)) out.push(loc);
        const max = distance.eval(base);
        for (const dir of dirs.eval(base)) {
          for (const to of ray(ctx, loc, dir, max)) {
            const sub = base.withFrame({ to });
            if (stopRule.eval(sub)) {
              if (stopIncluded.eval(sub)) out.push(to);
              break;
            }
            out.push(to);
          }
        }
      }
      return out;
    },
  };
}

register("region", "sites:Direction", compileSitesDirection as any);

// @java Core/src/game/functions/region/sites/between/SitesBetween.java

import { isIdent, isList, type LudList, type LudNode } from "@ludii/typescript-language";
import {
  compileBool,
  compileDirections,
  compileInt,
  dropSiteType,
  type CompileEnv,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { BoolFn, Dir, RegionFn } from "../../../../../../eval/eval-context.js";
import { OFF } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

function isTrue(node: LudNode | undefined): boolean {
  return !!node && isIdent(node) && node.name === "True";
}

function directionNode(nodes: readonly LudNode[]): LudNode | undefined {
  return nodes.find((n) => isIdent(n) || isList(n));
}

function followRay(
  ctx: Parameters<RegionFn["eval"]>[0],
  from: number,
  dir: Dir,
): number[] {
  const out: number[] = [];
  let x = ctx.board.xOf(from);
  let y = ctx.board.yOf(from);
  for (;;) {
    x += dir.dx;
    y += dir.dy;
    const site = ctx.board.siteAt(x, y);
    if (site < 0) break;
    out.push(site);
  }
  return out;
}

export function compileSitesBetween(node: LudList, env: CompileEnv): RegionFn {
  const { positional, named } = parseArgs(node.items.slice(2));
  const pos = dropSiteType(positional);
  const fromNode = named.get("from");
  const toNode = named.get("to");
  if (!fromNode || !toNode) return { eval: () => [] };
  const fromFn = compileInt(fromNode, env);
  const toFn = compileInt(toNode, env);
  const fromIncluded = isTrue(named.get("fromIncluded"));
  const toIncluded = isTrue(named.get("toIncluded"));
  const condNode = named.get("cond") ?? named.get("if") ?? named.get("If");
  const cond: BoolFn | undefined = condNode ? compileBool(condNode, env) : undefined;
  const dirs = directionNode(pos) ? compileDirections(directionNode(pos) as LudNode, env) : undefined;

  return {
    eval: (ctx) => {
      // SitesBetween.eval returns empty for OFF endpoints, pre-adds included
      // endpoints, binds from/to, scans the first matching radial, and adds
      // between sites in reverse order while binding context.between
      // (SitesBetween.java:90-170).
      const from = fromFn.eval(ctx);
      if (from <= OFF) return [];
      const to = toFn.eval(ctx);
      if (to <= OFF) return [];
      const out: number[] = [];
      if (fromIncluded) out.push(from);
      if (toIncluded) out.push(to);
      const dirList = dirs
        ? dirs.eval(ctx.withFrame({ from, to }))
        : compileDirections({ kind: "ident", name: "Adjacent" } as LudNode, env).eval(ctx.withFrame({ from, to }));
      for (const dir of dirList) {
        const ray = followRay(ctx, from, dir);
        const idx = ray.indexOf(to);
        if (idx < 0) continue;
        for (let i = idx - 1; i >= 0; i -= 1) {
          const between = ray[i] as number;
          if (!cond || cond.eval(ctx.withFrame({ from, to, between }))) {
            out.push(between);
          }
        }
        break;
      }
      return out;
    },
  };
}

register("region", "sites:Between", compileSitesBetween as any);

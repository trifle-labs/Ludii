// @java Core/src/game/functions/booleans/is/angle/IsReflex.java

import {
  isIdent,
  type LudList,
  type LudNode,
} from "@ludii/typescript-language";
import {
  compileBool,
  compileInt,
  type CompileEnv,
  dropSiteType,
  LudemeCompileError,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsReflex(node: LudList, env: CompileEnv): BoolFn {
  const { at, cond1, cond2, supportedType } = parseAngle(node, env);
  return {
    eval: (ctx) => {
      if (!supportedType) return false;
      const site = at.eval(ctx);
      const numSites = ctx.board.numSites;
      if (site < 0 || site >= numSites) return false;
      // Java scans every unordered pair of graph elements, binds context.site()
      // to each candidate for the two conditions, and tests the first match.
      // @java IsReflex.java:64-105
      for (let site1 = 0; site1 < numSites; site1 += 1) {
        for (let site2 = site1 + 1; site2 < numSites; site2 += 1) {
          if (site1 === site || site2 === site) continue;
          if (
            cond1.eval(ctx.withFrame({ site: site1 })) &&
            cond2.eval(ctx.withFrame({ site: site2 }))
          ) {
            const angle = pairAngle(ctx, site1, site2);
            if (angle > 180) return true;
          }
        }
      }
      return false;
    },
  };
}

function parseAngle(
  node: LudList,
  env: CompileEnv,
): {
  at: ReturnType<typeof compileInt>;
  cond1: BoolFn;
  cond2: BoolFn;
  supportedType: boolean;
} {
  const { positional, named } = parseArgs(node.items.slice(2));
  const siteType = siteTypeArg(positional);
  const supportedType =
    siteType === undefined || siteType === (env.boardDefaultSiteType ?? "Cell");
  const args = dropSiteType(positional);
  const atNode = named.get("at") ?? args[0];
  const condStart = named.has("at") ? 0 : 1;
  const cond1Node = args[condStart];
  const cond2Node = args[condStart + 1];
  if (!atNode || !cond1Node || !cond2Node) {
    throw new LudemeCompileError("(is Reflex at:<site> <cond1> <cond2>) needs at and two conditions.");
  }
  return {
    at: compileInt(atNode, env),
    cond1: compileBool(cond1Node, env),
    cond2: compileBool(cond2Node, env),
    supportedType,
  };
}

function siteTypeArg(positional: readonly LudNode[]): string | undefined {
  const node = positional[0];
  return node !== undefined && isIdent(node) &&
    (node.name === "Cell" || node.name === "Vertex" || node.name === "Edge")
    ? node.name
    : undefined;
}

function pairAngle(
  ctx: Parameters<BoolFn["eval"]>[0],
  site1: number,
  site2: number,
): number {
  const difX = ctx.board.xOf(site2) - ctx.board.xOf(site1);
  const difY = ctx.board.yOf(site2) - ctx.board.yOf(site1);
  return Math.abs((Math.atan2(difX, -difY) * 180) / Math.PI);
}

register("bool", "Reflex", compileIsReflex as any);

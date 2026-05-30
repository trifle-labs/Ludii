// @java Core/src/game/functions/ints/count/site/CountOff.java

import { type LudList } from "@ludii/typescript-language";
import {
  aroundSites,
  compileInt,
  compileRegion,
  lastToSite,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import { OFF, type EvalContext, type IntFn, type RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileCountOff(node: LudList, env: CompileEnv): IntFn {
  const siteFn = compileSiteSource(node, env);
  return {
    // Java CountOff.eval reads the first region/at site, then counts the cell's
    // off-diagonal/off list; edges/vertices return 0 (CountOff.java:62-89).
    eval: (ctx) => countFor(ctx, siteFn(ctx), "OffDiagonal"),
  };
}

function compileSiteSource(node: LudList, env: CompileEnv): (ctx: EvalContext) => number {
  const { named } = parseArgs(node.items.slice(1));
  const inNode = named.get("in");
  const atNode = named.get("at");
  const region: RegionFn | undefined = inNode ? compileRegion(inNode, env) : undefined;
  const at: IntFn | undefined = atNode ? compileInt(atNode, env) : undefined;
  return (ctx) => (region ? region.eval(ctx)[0] ?? OFF : at ? at.eval(ctx) : lastToSite(ctx));
}

function countFor(ctx: EvalContext, site: number, relation: string): number {
  if (site < 0 || site >= ctx.board.numSites) return OFF;
  return aroundSites(ctx, site, [relation]).length;
}

register("int", "count:Off", compileCountOff as any);

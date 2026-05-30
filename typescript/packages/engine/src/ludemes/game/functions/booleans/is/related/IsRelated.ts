// @java Core/src/game/functions/booleans/is/related/IsRelated.java

import {
  isIdent,
  type LudList,
} from "@ludii/typescript-language";
import {
  aroundSites,
  compileInt,
  type CompileEnv,
  compileRegion,
  LudemeCompileError,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type {
  BoolFn,
  RegionFn,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsRelated(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  const relNode = positional[0];
  const siteANode = positional[1];
  const siteBNode = positional[2];
  if (!relNode || !siteANode || !siteBNode) {
    throw new LudemeCompileError("(is Related <relation> <siteA> <siteB|regionB>) needs three arguments.");
  }
  const relation = isIdent(relNode) ? relNode.name : "Adjacent";
  const siteA = compileInt(siteANode, env);
  let regionB: RegionFn;
  try {
    regionB = compileRegion(siteBNode, env);
  } catch {
    const siteB = compileInt(siteBNode, env);
    regionB = {
      eval: (ctx) => {
        const site = siteB.eval(ctx);
        return site >= 0 ? [site] : [];
      },
    };
  }
  return {
    eval: (ctx) => {
      const location = siteA.eval(ctx);
      if (location < 0) return false;
      // Java dispatches by RelationType and succeeds if siteA is in that
      // relation with any site from regionB. TS's aroundSites maps those
      // relation tokens to the board topology/direction groups.
      // @java IsRelated.java:70-218
      const related = new Set(aroundSites(ctx, location, [relation]));
      return regionB.eval(ctx).some((site) => related.has(site));
    },
  };
}

register("bool", "Related", compileIsRelated as any);

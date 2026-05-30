// @java Core/src/game/functions/booleans/all/sites/AllDifferent.java

import { isIdent, type LudList, type LudNode } from "@ludii/typescript-language";
import {
  allSites,
  compileBool,
  compileRegion,
  type CompileEnv,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type {
  BoolFn,
  RegionFn,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

function argsAfterSubtype(node: LudList): readonly LudNode[] {
  const head = node.items[0];
  return node.items.slice(head !== undefined && isIdent(head) && head.name === "all" ? 2 : 1);
}

export function compileAllDifferent(node: LudList, env: CompileEnv): BoolFn {
  const { positional, named } = parseArgs(argsAfterSubtype(node));
  const regionNode = positional[0];
  const ifNode = named.get("if") ?? named.get("If");
  const region: RegionFn = regionNode
    ? compileRegion(regionNode, env)
    : { eval: (ctx) => allSites(ctx) };
  const condition: BoolFn = ifNode
    ? compileBool(ifNode, env)
    : { eval: () => true };

  // Java binds context.site(), requires the condition, then records cs.what()
  // for every checked site; duplicate what-values (including 0) fail
  // (AllDifferent.java:55-90).
  return {
    eval: (ctx) => {
      const seen = new Set<number>();
      for (const site of region.eval(ctx)) {
        if (!condition.eval(ctx.withFrame({ site }))) return false;
        const what = ctx.state.whatAtSite(site);
        if (seen.has(what)) return false;
        seen.add(what);
      }
      return true;
    },
  };
}

register("bool", "Different", compileAllDifferent as any);

// @java Core/src/game/functions/region/math/Expand.java

import {
  isIdent,
  type LudList,
  type LudNode,
} from "@ludii/typescript-language";
import {
  aroundSites,
  compileInt,
  compileRegion,
  type CompileEnv,
  parseArgs,
} from "../../../../../eval/compile.js";
import type { IntFn, RegionFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

function directionOrGroup(node: LudNode | undefined): string | undefined {
  return node && isIdent(node) ? node.name : undefined;
}

function expandLayer(
  sites: readonly number[],
  ctx: Parameters<RegionFn["eval"]>[0],
  token: string | undefined,
): number[] {
  const out = new Set<number>(sites);
  for (const site of sites) {
    if (site < 0) continue;
    for (const n of aroundSites(ctx, site, token ? [token] : ["Adjacent"])) {
      out.add(n);
    }
  }
  return [...out];
}

export function compileExpand(node: LudList, env: CompileEnv): RegionFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const originNode = named.get("origin") ?? positional[0];
  if (!originNode) return { eval: () => [] };
  const stepsNode = named.get("steps");
  const steps: IntFn = stepsNode ? compileInt(stepsNode, env) : { eval: () => 1 };
  const dirToken = directionOrGroup(
    positional.find((p) => p !== originNode && isIdent(p)),
  );

  let baseRegion: RegionFn;
  try {
    baseRegion = compileRegion(originNode, env);
  } catch {
    const origin = compileInt(originNode, env);
    baseRegion = { eval: (ctx) => {
      const site = origin.eval(ctx);
      return site >= 0 ? [site] : [];
    } };
  }

  return {
    eval: (ctx) => {
      // Expand.eval starts from the supplied region/site and applies Region.expand
      // only when steps > 0; otherwise it returns the original region
      // (Expand.java:99-120). A direction token restricts each layer to that
      // trajectory; no direction uses Adjacent topology expansion.
      let region = baseRegion.eval(ctx);
      const numSteps = steps.eval(ctx);
      for (let i = 0; i < numSteps; i += 1) {
        region = expandLayer(region, ctx, dirToken);
      }
      return region;
    },
  };
}

register("region", "expand", compileExpand as any);

// @java Core/src/game/functions/ints/count/steps/CountSteps.java

import { isIdent, isList, listHead, type LudList, type LudNode } from "@ludii/typescript-language";
import {
  aroundSites,
  compileInt,
  compileRegion,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import { OFF, type EvalContext, type IntFn, type RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

const SITE_TYPES = new Set(["Cell", "Vertex", "Edge"]);
const RELATIONS = new Set(["Adjacent", "All", "Orthogonal", "Diagonal", "OffDiagonal"]);

export function compileCountSteps(node: LudList, env: CompileEnv): IntFn {
  const { positional } = parseArgs(node.items.slice(1));
  let relation = "Adjacent";
  const args: LudNode[] = [];
  for (const p of positional.slice(1)) {
    if (isIdent(p) && SITE_TYPES.has(p.name)) continue;
    if (isIdent(p) && RELATIONS.has(p.name)) {
      relation = p.name;
      continue;
    }
    if (isList(p) && listHead(p) === "step") {
      // TODO: needs Step move simulation/newRotation path from CountSteps.java:117-198.
      continue;
    }
    args.push(p);
  }
  const a = args[args.length - 2];
  const b = args[args.length - 1];
  const from: IntFn = a ? compileInt(a, env) : { eval: () => OFF };
  const to: RegionFn = b ? compileRegion(b, env) : { eval: () => [] as number[] };

  return {
    eval: (ctx) => {
      // Java CountSteps.eval returns 0 for negative start/empty target region,
      // otherwise the minimum topology distance to any target
      // (Core/src/game/functions/ints/count/steps/CountSteps.java:89-116).
      const s1 = from.eval(ctx);
      if (s1 < 0) return 0;
      const targets = to.eval(ctx).filter((s) => s >= 0);
      if (targets.length === 0) return 0;
      let min = OFF;
      for (const s2 of targets) {
        const d = bfsDistance(ctx, s1, s2, relation);
        if (d >= 0 && (min < 0 || d < min)) min = d;
      }
      return min;
    },
  };
}

function bfsDistance(ctx: EvalContext, from: number, to: number, relation: string): number {
  if (from === to) return 0;
  const seen = new Set<number>([from]);
  let frontier = [from];
  let dist = 0;
  while (frontier.length > 0) {
    dist += 1;
    const next: number[] = [];
    for (const site of frontier) {
      for (const n of aroundSites(ctx, site, [relation])) {
        if (seen.has(n)) continue;
        if (n === to) return dist;
        seen.add(n);
        next.push(n);
      }
    }
    frontier = next;
  }
  return OFF;
}

register("int", "count:Steps", compileCountSteps as any);

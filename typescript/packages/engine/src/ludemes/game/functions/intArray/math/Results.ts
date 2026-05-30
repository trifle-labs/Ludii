// @java Core/src/game/functions/intArray/math/Results.java

import type { LudList } from "@ludii/typescript-language";
import {
  compileInt,
  compileSiteOrRegion,
  type CompileEnv,
  parseArgs,
} from "../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileResults(node: LudList, env: CompileEnv): RegionFn {
  const { positional: resPos, named: resNamed } = parseArgs(node.items.slice(1));
  // (results from:<siteOrRegion> to:<siteOrRegion> <intFn>) - iterate every
  // (from, to) pair, evaluate the int body with frame.from/frame.to bound,
  // and collect the resulting integers as a region (used by `is In`).
  // Java: game.functions.intArray.math.Results
  const fromNode = resNamed.get("from") ?? resNamed.get("From");
  const toNode = resNamed.get("to") ?? resNamed.get("To");
  const bodyNode = resPos[resPos.length - 1];
  if (!bodyNode) return { eval: () => [] };
  const fromRegion = fromNode
    ? compileSiteOrRegion(fromNode, env)
    : undefined;
  const toRegion = toNode ? compileSiteOrRegion(toNode, env) : undefined;
  const bodyFn = compileInt(bodyNode, env);
  return {
    eval: (ctx) => {
      const froms = fromRegion
        ? fromRegion.eval(ctx)
        : [ctx.frame.from ?? -1];
      const out: number[] = [];
      for (const f of froms) {
        const ctxF = ctx.withFrame({ from: f });
        const tos = toRegion ? toRegion.eval(ctxF) : [ctxF.frame.to ?? -1];
        for (const t of tos) {
          out.push(bodyFn.eval(ctxF.withFrame({ to: t })));
        }
      }
      return out;
    },
  };
}

register("region", "results", compileResults as any);

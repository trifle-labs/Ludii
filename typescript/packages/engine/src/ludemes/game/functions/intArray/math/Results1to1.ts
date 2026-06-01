/**
 * Results1to1.ts
 * @java game/functions/intArray/math/Results.java
 *
 * (results from:<site-or-region> to:<site-or-region> <intFn>)
 * Iterates every (from, to) pair, evaluates the int body with _evalFrom/_evalTo bound,
 * and returns the collected results.
 */

import type { Context } from "../../../../../context.js";
import type { IntArrayFunction, IntFunction, RegionFunction, EvalScratch } from "../../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";
import { registerIntArray1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import {
  compileInt1to1,
  compileRegion1to1,
  parseArgs1to1,
} from "../../../../../compiler1to1.js";

/** Wraps a single int as a one-site "region". */
function wrapIntAsRegion(fn: IntFunction): RegionFunction {
  return {
    eval(ctx: Context & EvalScratch): number[] {
      return [fn.eval(ctx)];
    }
  };
}

export class Results1to1 implements IntArrayFunction {
  /** @java game/functions/intArray/math/Results.java — eval(Context) */
  constructor(
    private readonly regionFrom: RegionFunction,
    private readonly regionTo: RegionFunction,
    private readonly functionFn: IntFunction,
  ) {}

  public eval(ctx: Context & EvalScratch): number[] {
    // @java Results.java:85-106
    const result: number[] = [];
    const sitesFrom = this.regionFrom.eval(ctx);
    const originFrom = ctx._evalFrom;
    const originTo = ctx._evalTo;

    for (const from of sitesFrom) {
      ctx._evalFrom = from;
      const sitesTo = this.regionTo.eval(ctx);
      for (const to of sitesTo) {
        ctx._evalTo = to;
        result.push(this.functionFn.eval(ctx));
      }
    }

    ctx._evalFrom = originFrom;
    ctx._evalTo = originTo;
    return result;
  }
}

registerIntArray1to1("results", (node: LudNode, _env: Compile1to1Env): IntArrayFunction => {
  const list = node as LudList;
  const { positional, named } = parseArgs1to1(list.items);

  const fromNode = named.get("from") ?? named.get("From");
  const toNode = named.get("to") ?? named.get("To");
  // last positional = the function body
  const bodyNode = positional[positional.length - 1];

  const bodyFn: IntFunction = bodyNode
    ? compileInt1to1(bodyNode)
    : { eval: (_ctx: Context) => 0 };

  let fromRegion: RegionFunction;
  if (fromNode) {
    // Try region first, fall back to single int site
    try {
      fromRegion = compileRegion1to1(fromNode);
    } catch {
      fromRegion = wrapIntAsRegion(compileInt1to1(fromNode));
    }
  } else {
    fromRegion = { eval: (ctx: Context & EvalScratch) => [ctx._evalFrom] };
  }

  let toRegion: RegionFunction;
  if (toNode) {
    try {
      toRegion = compileRegion1to1(toNode);
    } catch {
      toRegion = wrapIntAsRegion(compileInt1to1(toNode));
    }
  } else {
    toRegion = { eval: (ctx: Context & EvalScratch) => [ctx._evalTo] };
  }

  return new Results1to1(fromRegion, toRegion, bodyFn);
});

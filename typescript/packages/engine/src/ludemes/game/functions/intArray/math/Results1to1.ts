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
  private readonly regionFrom: RegionFunction;
  private readonly regionTo: RegionFunction;
  private readonly functionFn: IntFunction;

  /** @java game/functions/intArray/math/Results.java — eval(Context) */
  constructor(
    from: IntFunction | null,
    From: RegionFunction | null,
    to: IntFunction | null,
    To: RegionFunction | null,
    functionFn: IntFunction,
  ) {
    let numNonNull = 0;
    if (from !== null) numNonNull++;
    if (From !== null) numNonNull++;

    if (numNonNull !== 1) {
      throw new Error("Only one Or parameter must be non-null.");
    }

    let numNonNull2 = 0;
    if (to !== null) numNonNull2++;
    if (To !== null) numNonNull2++;

    if (numNonNull2 !== 1) {
      throw new Error("Only one Or2 parameter must be non-null.");
    }

    this.functionFn = functionFn;
    this.regionFrom = from !== null ? wrapIntAsRegion(from) : From!;
    this.regionTo = to !== null ? wrapIntAsRegion(to) : To!;
  }

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

  const fromNode = named.get("from");
  const toNode = named.get("to");
  // last positional = the function body
  const bodyNode = positional[positional.length - 1];

  const bodyFn: IntFunction = bodyNode
    ? compileInt1to1(bodyNode)
    : { eval: (_ctx: Context) => 0 };

  let from: IntFunction | null = null;
  let From: RegionFunction | null = null;
  if (fromNode) {
    // Try region first, fall back to single int site
    try {
      From = compileRegion1to1(fromNode);
    } catch {
      from = compileInt1to1(fromNode);
    }
  } else {
    from = { eval: (ctx: Context & EvalScratch) => ctx._evalFrom };
  }

  let to: IntFunction | null = null;
  let To: RegionFunction | null = null;
  if (toNode) {
    try {
      To = compileRegion1to1(toNode);
    } catch {
      to = compileInt1to1(toNode);
    }
  } else {
    to = { eval: (ctx: Context & EvalScratch) => ctx._evalTo };
  }

  return new Results1to1(from, From, to, To, bodyFn);
});

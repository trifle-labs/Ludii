/**
 * Results.ts
 * @java game/functions/intArray/math/Results.java
 *
 * (results from:<site-or-region> to:<site-or-region> <intFn>)
 * Iterates every (from, to) pair, evaluates the int body with _evalFrom/_evalTo bound,
 * and returns the collected results.
 */

import type { Context } from "../../../../../context.js";
import type { IntArrayFunction, IntFunction, RegionFunction, EvalScratch } from "../../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";

/** Wraps a single int as a one-site "region". */
function wrapIntAsRegion(fn: IntFunction): RegionFunction {
  return {
    eval(ctx: Context & EvalScratch): number[] {
      return [fn.eval(ctx)];
    }
  };
}

export class Results implements IntArrayFunction {
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


/**
 * CountStack.ts
 * @java game/functions/ints/count/stack/CountStack.java
 *
 * (count Stack [FromBottom|FromTop] [<type>] to:<region> [if:<cond>]
 * [stop:<cond>]) — walks every level of each stack in the region, binding
 * (to)/(level), counting levels where `if` holds, stopping the walk at the
 * first level where `stop` holds.
 */

import type { Context } from "../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../base.js";

/** @java Constants.UNDEFINED */
const UNDEFINED = -1;

type EvalScratch = { _evalTo?: number; _evalLevel?: number };

export class CountStack implements IntFunction {
  /** @java CountStack.region — IntArrayFromRegion (at: single site or to: region). */
  private readonly regionFn: { eval(ctx: Context): number | number[] };
  /** @java CountStack.condition — [True]. */
  private readonly condition: BooleanFunction | null;
  /** @java CountStack.stopCondition — [False]. */
  private readonly stopCondition: BooleanFunction | null;
  /** @java CountStack.stackDirection — [FromBottom]. */
  private readonly stackDirection: string;
  /**
   * @java type — SiteType; flat-state substrate, see pattern #5.
   * Stored but eval behaviour is substrate-independent in the flat state.
   */
  private readonly siteType: string | null;

  public constructor(
    regionFn: { eval(ctx: Context): number | number[] },
    condition: BooleanFunction | null = null,
    stopCondition: BooleanFunction | null = null,
    stackDirection: string | null = null,
    siteType: string | null = null,
  ) {
    this.regionFn = regionFn;
    this.condition = condition;
    this.stopCondition = stopCondition;
    this.stackDirection = stackDirection ?? "FromBottom";
    this.siteType = siteType;
  }

  /**
   * @java CountStack.eval — per-level walk with (to)/(level) bound; without
   * a condition this degrades to the plain stack size (or flat count).
   */
  public eval(ctx: Context): number {
    const raw = this.regionFn.eval(ctx);
    const sites = Array.isArray(raw) ? raw : [raw];

    const scratch = ctx as Context & EvalScratch;
    const origTo = scratch._evalTo;
    const origLevel = scratch._evalLevel;

    let count = 0;
    for (const site of sites) {
      if (site <= UNDEFINED) continue;
      if (ctx.state.what(site) === 0) continue;
      // @java cs.sizeStack — stacks row when present, else the flat count
      // (a flat pile of N is an N-level homogeneous stack in Java).
      const stackRow = ctx.state.stacks[site];
      const sz = stackRow !== undefined && stackRow.length > 0
        ? stackRow.length
        : Math.max(1, ctx.state.count(site));
      if (this.condition === null && this.stopCondition === null) {
        count += sz;
        continue;
      }
      const topLevel = sz - 1;
      const fromBottom = this.stackDirection !== "FromTop";
      for (
        let level = fromBottom ? 0 : topLevel;
        fromBottom ? level <= topLevel : level >= 0;
        level += fromBottom ? 1 : -1
      ) {
        scratch._evalTo = site;
        scratch._evalLevel = level;
        if (this.stopCondition !== null && this.stopCondition.eval(ctx)) break;
        if (this.condition === null || this.condition.eval(ctx)) count += 1;
      }
    }

    scratch._evalTo = origTo;
    scratch._evalLevel = origLevel;
    return count;
  }
}

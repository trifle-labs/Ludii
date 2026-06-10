/**
 * CountSizeBiggestLine1to1.ts
 * @java game/functions/ints/count/sizeBiggestLine/CountSizeBiggestLine.java
 *
 * (count SizeBiggestLine [if:<cond>]) — returns the length of the longest
 * contiguous line of occupied sites (across all radials/directions).
 *
 * Java eval logic:
 *   1. Collect all "pivot" sites where condition is true.
 *   2. For each pivot, iterate all radials (lines).
 *   3. Count consecutive matching sites along ray + opposite ray.
 *   4. Return the maximum line length found.
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction, BooleanFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import type { EvalScratch } from "../../../../base.js";
import type { CellFlatRadials } from "../../../../topology-radials.js";
import { registerInt1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import { parseArgs1to1, compileBool1to1 } from "../../../../../compiler1to1.js";

export class CountSizeBiggestLine1to1 implements IntFunction {
  /** @java CountSizeBiggestLine.condition — default IsOccupied */
  private readonly condition: BooleanFunction | null;

  public constructor(condition: BooleanFunction | null) {
    this.condition = condition;
  }

  /**
   * @java game/functions/ints/count/sizeBiggestLine/CountSizeBiggestLine.java — eval(Context)
   * For each pivot site where condition holds, walk each radial axis forward
   * and backward counting consecutive matching sites.
   */
  public eval(ctx: Context & EvalScratch): number {
    const cells = ctx.state.cells;
    const ctxAny = ctx as unknown as { _radials?: readonly CellFlatRadials[] };
    const radials = ctxAny._radials;
    const origTo = ctx._evalTo;

    if (!radials) {
      ctx._evalTo = origTo;
      return 0;
    }

    const boardN = radials.length;

    // Collect pivots where condition is satisfied
    const pivots: number[] = [];
    for (let site = 0; site < boardN; site++) {
      if (this.condition !== null) {
        ctx._evalTo = site;
        if (this.condition.eval(ctx)) pivots.push(site);
      } else {
        if ((cells[site] ?? 0) !== 0) pivots.push(site);
      }
    }

    ctx._evalTo = origTo;

    if (pivots.length === 0) return 0;

    const pivotSet = new Set(pivots);
    let biggest = 0;

    for (const pivot of pivots) {
      const cellRadials = radials[pivot];
      if (!cellRadials) continue;

      for (const axis of cellRadials.axes) {
        // Walk forward ray starting from index 1 (index 0 is pivot itself)
        let count = 1;
        for (let idx = 1; idx < axis.ray.length; idx++) {
          const s = axis.ray[idx]!;
          if (pivotSet.has(s)) {
            count++;
          } else {
            break;
          }
        }

        // Walk opposite ray (also starting from index 1)
        let oppositeCount = count;
        for (let idx = 1; idx < axis.opposite.length; idx++) {
          const s = axis.opposite[idx]!;
          if (pivotSet.has(s)) {
            oppositeCount++;
          } else {
            break;
          }
        }

        if (oppositeCount > biggest) biggest = oppositeCount;
      }
    }

    ctx._evalTo = origTo;
    return biggest;
  }
}


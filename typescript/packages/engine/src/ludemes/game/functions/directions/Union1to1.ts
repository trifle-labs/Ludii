/**
 * Union1to1.ts
 * @java Core/src/game/functions/directions/Union.java
 *
 * (union <dir1> <dir2>) — returns the union of two direction name sets.
 *
 * Java semantics: Union.convertToAbsolute expands group names to concrete
 * compass names using `element.supportedDirections(relation)` (per-element),
 * then performs a set union.  In the 1:1 eval(ctx) path we do not have a
 * current element, so we keep symbolic group names where possible and expand
 * only when both sides are specific compass names.  Callers such as
 * Trajectories.step/ray/group accept both specific names and group names,
 * so returning symbolic names is correct for the common cases.
 *
 * @java Core/src/game/functions/directions/Union.java — convertToAbsolute
 */

import type { Context } from "../../../../context.js";
import type { DirectionsFunction } from "../../../base.js";
import type { LudList, LudNode } from "@ludii/typescript-language";

export class Union1to1 implements DirectionsFunction {
  private readonly dir1: DirectionsFunction;
  private readonly dir2: DirectionsFunction;

  /** @java Union.java — constructor(Direction directions, Direction directionsToRemove) */
  public constructor(dir1: DirectionsFunction, dir2: DirectionsFunction) {
    this.dir1 = dir1;
    this.dir2 = dir2;
  }

  /**
   * @java Union.java — convertToAbsolute: union of the two direction name sets,
   * deduplicated preserving order.
   */
  public eval(ctx: Context): string[] {
    const names1 = this.dir1.eval(ctx);
    const names2 = this.dir2.eval(ctx);
    const seen = new Set<string>(names1);
    const result = [...names1];
    for (const n of names2) {
      if (!seen.has(n)) {
        seen.add(n);
        result.push(n);
      }
    }
    return result;
  }
}


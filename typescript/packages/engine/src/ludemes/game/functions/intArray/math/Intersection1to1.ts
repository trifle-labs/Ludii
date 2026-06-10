/**
 * Intersection1to1.ts
 * @java game/functions/intArray/math/Intersection.java
 *
 * (intersection <a1> <a2>) or (intersection {<a1> ...}) — elements common to all arrays.
 */

import type { Context } from "../../../../../context.js";
import type { IntArrayFunction } from "../../../../base.js";
import { isList } from "@ludii/typescript-language";
import type { LudNode, LudList } from "@ludii/typescript-language";

export class Intersection1to1 implements IntArrayFunction {
  /** @java game/functions/intArray/math/Intersection.java — eval(Context) */
  constructor(private readonly arrays: IntArrayFunction[]) {}

  public eval(ctx: Context): number[] {
    // @java Intersection.java:73-108
    if (this.arrays.length === 0) return [];
    if (this.arrays.length === 2) {
      // two-array form: filter second array by membership in first
      const values1 = this.arrays[0]!.eval(ctx);
      const values2 = [...this.arrays[1]!.eval(ctx)];
      return values2.filter(v => values1.includes(v));
    }
    // many-array form: start with first, remove elements absent from each subsequent
    let out = [...this.arrays[0]!.eval(ctx)];
    for (let i = 1; i < this.arrays.length; i++) {
      const values = this.arrays[i]!.eval(ctx);
      out = out.filter(v => values.includes(v));
    }
    return out;
  }
}


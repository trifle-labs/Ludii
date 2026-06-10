/**
 * Union1to1.ts
 * @java game/functions/intArray/math/Union.java
 *
 * (union <a1> <a2>) or (union {<a1> <a2> ...}) — merge arrays (no duplicate values).
 */

import type { Context } from "../../../../../context.js";
import type { IntArrayFunction } from "../../../../base.js";
import { isList } from "@ludii/typescript-language";
import type { LudNode, LudList } from "@ludii/typescript-language";

export class Union1to1 implements IntArrayFunction {
  /** @java game/functions/intArray/math/Union.java — eval(Context) */
  constructor(private readonly arrays: IntArrayFunction[]) {}

  public eval(ctx: Context): number[] {
    // @java Union.java:74-109
    if (this.arrays.length === 0) return [];
    const out = [...this.arrays[0]!.eval(ctx)];
    for (let i = 1; i < this.arrays.length; i++) {
      for (const v of this.arrays[i]!.eval(ctx)) {
        if (!out.includes(v)) out.push(v);
      }
    }
    return out;
  }
}


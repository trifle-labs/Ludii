/**
 * Union.ts
 * @java game/functions/intArray/math/Union.java
 *
 * (union <a1> <a2>) or (union {<a1> <a2> ...}) — merge arrays (no duplicate values).
 */

import type { Context } from "../../../../../context.js";
import type { IntArrayFunction } from "../../../../base.js";
import { isList } from "@ludii/typescript-language";
import type { LudNode, LudList } from "@ludii/typescript-language";

export class Union implements IntArrayFunction {
  private readonly arrays: IntArrayFunction[];

  /**
   * @java Union has TWO constructors: Union(array1, array2) and
   * Union(IntArrayFunction[] arrays). The reflection compiler invokes the
   * 2-arg form for `(union A B)`, which our array-only ctor collapsed to a
   * single non-array operand (Bosh's skipIf union of two (values Remembered)
   * threw `arrays[0].eval is not a function`). Normalize both forms here.
   */
  constructor(arraysOrFirst: IntArrayFunction[] | IntArrayFunction, second?: IntArrayFunction) {
    if (second !== undefined) {
      this.arrays = [arraysOrFirst as IntArrayFunction, second];
    } else if (Array.isArray(arraysOrFirst)) {
      this.arrays = arraysOrFirst;
    } else {
      this.arrays = [arraysOrFirst];
    }
  }

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


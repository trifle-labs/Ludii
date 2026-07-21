// @java Core/src/game/functions/ints/math/Add.java

/**
 * Adds two or more int values.
 *
 * @java game/functions/ints/math/Add.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction } from "../../../../base.js";

function isIntFunction(value: unknown): value is IntFunction {
  return value !== null && typeof value === "object" && typeof (value as { eval?: unknown }).eval === "function";
}

export class Add implements IntFunction {
  private readonly fns: readonly IntFunction[] | null;
  private readonly arrayFn: { eval(ctx: Context): readonly number[] } | null;

  public constructor(
    fns: readonly IntFunction[] | IntFunction | null,
    bOrArray: IntFunction | { eval(ctx: Context): readonly number[] } | null = null,
  ) {
    if (Array.isArray(fns)) {
      this.fns = fns as readonly IntFunction[];
      this.arrayFn = null;
    } else if (fns !== null) {
      this.fns = bOrArray !== null && isIntFunction(bOrArray) ? [fns as IntFunction, bOrArray] : [fns as IntFunction];
      this.arrayFn = null;
    } else {
      this.fns = null;
      this.arrayFn = bOrArray as { eval(ctx: Context): readonly number[] } | null;
    }
  }

  /** @java game/functions/ints/math/Add.java — eval: sum of all IntArrayFunction values */
  public eval(ctx: Context): number {
    let sum = 0;
    if (this.fns !== null) {
      for (const f of this.fns) sum += f.eval(ctx);
    } else {
      for (const value of this.arrayFn?.eval(ctx) ?? []) sum += value;
    }
    return sum;
  }
}

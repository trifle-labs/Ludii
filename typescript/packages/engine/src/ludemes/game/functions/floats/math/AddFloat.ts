// @java Core/src/game/functions/floats/math/Add.java

/**
 * Adds two or more float values.
 *
 * @java game/functions/floats/math/Add.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import type { FloatFunction } from "../../../../base.js";

export class Add implements FloatFunction {
  private readonly a: FloatFunction | null;
  private readonly b: FloatFunction | null;
  private readonly list: readonly FloatFunction[] | null;

  public constructor(a: FloatFunction, b: FloatFunction);
  public constructor(list: readonly FloatFunction[]);
  public constructor(
    aOrList: FloatFunction | readonly FloatFunction[],
    ...rest: [] | [b: FloatFunction]
  ) {
    if (Array.isArray(aOrList)) {
      this.a = null;
      this.b = null;
      this.list = aOrList as readonly FloatFunction[];
    } else {
      this.a = aOrList as FloatFunction;
      this.b = rest[0]!;
      this.list = null;
    }
  }

  /** @java game/functions/floats/math/Add.java — eval(Context) */
  public eval(ctx: Context): number {
    if (this.list === null) {
      return this.a!.eval(ctx) + this.b!.eval(ctx);
    }
    let sum = 0;
    for (const elem of this.list) sum += elem.eval(ctx);
    return sum;
  }
}

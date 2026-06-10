/**
 * Add.ts
 * @java game/functions/dim/math/Add.java
 *
 * Adds two or more dim values.
 * Java key alias: "+" — already registered in ints1to1/math/Math1to1.ts.
 * This class is NOT registered (would clobber the existing "+" key).
 */

import type { DimFunction } from "../DimFunction.js";
import { BaseDimFunction } from "../BaseDimFunction.js";

export class DimAdd extends BaseDimFunction {
  /** Two-arg form: a + b */
  private readonly a: DimFunction | null;
  private readonly b: DimFunction | null;
  /** List form: sum of all elements */
  private readonly list: readonly DimFunction[] | null;

  /** @java Add(DimFunction a, DimFunction b) */
  public constructor(a: DimFunction, b: DimFunction);
  /** @java Add(DimFunction[] list) */
  public constructor(list: readonly DimFunction[]);
  public constructor(
    a: DimFunction | readonly DimFunction[],
    b?: DimFunction,
  ) {
    super();
    if (Array.isArray(a)) {
      this.a = null;
      this.b = null;
      this.list = a as readonly DimFunction[];
    } else {
      this.a = a as DimFunction;
      this.b = b!;
      this.list = null;
    }
  }

  /** @java game/functions/dim/math/Add.java — eval() returns a+b or sum of list */
  public eval(): number {
    if (this.list === null) {
      return this.a!.eval() + this.b!.eval();
    }
    let sum = 0;
    for (const elem of this.list) sum += elem.eval();
    return sum;
  }
}

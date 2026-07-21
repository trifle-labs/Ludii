/**
 * Mul1to1.ts
 * @java game/functions/dim/math/Mul.java
 *
 * Returns the product of two or more dim values.
 * Java key alias: "*" — already registered in ints1to1/math/Math1to1.ts.
 * This class is NOT registered (would clobber the existing "*" key).
 */

import type { DimFunction } from "../DimFunction.js";
import { BaseDimFunction } from "../BaseDimFunction.js";

export class DimMul extends BaseDimFunction {
  /** Two-arg form: a * b */
  private readonly a: DimFunction | null;
  private readonly b: DimFunction | null;
  /** List form: product of all elements */
  private readonly list: readonly DimFunction[] | null;

  /** @java Mul(DimFunction a, DimFunction b) */
  public constructor(a: DimFunction, b: DimFunction);
  /** @java Mul(DimFunction[] list) */
  public constructor(list: readonly DimFunction[]);
  constructor(
    aOrList: DimFunction | readonly DimFunction[],
    b: DimFunction | null = null,
  ) {
    super();
    if (Array.isArray(aOrList)) {
      this.a = null;
      this.b = null;
      this.list = aOrList as readonly DimFunction[];
    } else {
      this.a = aOrList as DimFunction;
      this.b = b ?? null;
      this.list = null;
    }
  }

  /** @java game/functions/dim/math/Mul.java — eval() returns a*b or product of list */
  public eval(): number {
    if (this.list === null) {
      return (this.a?.eval() ?? 1) * (this.b?.eval() ?? 1);
    }
    let mul = 1;
    for (const elem of this.list) mul *= elem.eval();
    return mul;
  }
}

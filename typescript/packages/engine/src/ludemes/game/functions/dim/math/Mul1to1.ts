/**
 * Mul1to1.ts
 * @java game/functions/dim/math/Mul.java
 *
 * Returns the product of two or more dim values.
 * Java key alias: "*" — already registered in ints1to1/math/Math1to1.ts.
 * This class is NOT registered (would clobber the existing "*" key).
 */

import type { DimFunction1to1 } from "../DimConstant1to1.js";

export class DimMul1to1 implements DimFunction1to1 {
  /** Two-arg form: a * b */
  private readonly a: DimFunction1to1 | null;
  private readonly b: DimFunction1to1 | null;
  /** List form: product of all elements */
  private readonly list: readonly DimFunction1to1[] | null;

  /** Two-value constructor: (* a b) */
  constructor(a: DimFunction1to1, b: DimFunction1to1);
  /** List constructor: (* {list...}) */
  constructor(list: readonly DimFunction1to1[]);
  constructor(
    aOrList: DimFunction1to1 | readonly DimFunction1to1[],
    b?: DimFunction1to1,
  ) {
    if (Array.isArray(aOrList)) {
      this.a = null;
      this.b = null;
      this.list = aOrList as readonly DimFunction1to1[];
    } else {
      this.a = aOrList as DimFunction1to1;
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

/**
 * Add1to1.ts
 * @java game/functions/dim/math/Add.java
 *
 * Adds two or more dim values.
 * Java key alias: "+" — already registered in ints1to1/math/Math1to1.ts.
 * This class is NOT registered (would clobber the existing "+" key).
 */

import type { DimFunction1to1 } from "../DimConstant1to1.js";

export class DimAdd implements DimFunction1to1 {
  /** Two-arg form: a + b */
  private readonly a: DimFunction1to1 | null;
  private readonly b: DimFunction1to1 | null;
  /** List form: sum of all elements */
  private readonly list: readonly DimFunction1to1[] | null;

  /** @java Add(DimFunction a, DimFunction b) */
  public constructor(a: DimFunction1to1, b: DimFunction1to1);
  /** @java Add(DimFunction[] list) */
  public constructor(list: readonly DimFunction1to1[]);
  public constructor(
    a: DimFunction1to1 | readonly DimFunction1to1[],
    b?: DimFunction1to1,
  ) {
    if (Array.isArray(a)) {
      this.a = null;
      this.b = null;
      this.list = a as readonly DimFunction1to1[];
    } else {
      this.a = a as DimFunction1to1;
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

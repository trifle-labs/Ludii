/**
 * Max1to1.ts
 * @java game/functions/dim/math/Max.java
 *
 * Returns the maximum of two dim values.
 * Java key: "max" — already registered in ints1to1/math/Math1to1.ts.
 * This class is NOT registered (would clobber the existing "max" key).
 */

import type { DimFunction1to1 } from "../DimConstant1to1.js";

export class DimMax1to1 implements DimFunction1to1 {
  private readonly valueA: DimFunction1to1;
  private readonly valueB: DimFunction1to1;

  constructor(valueA: DimFunction1to1, valueB: DimFunction1to1) {
    this.valueA = valueA;
    this.valueB = valueB;
  }

  /** @java game/functions/dim/math/Max.java — eval() returns Math.max(valueA, valueB) */
  public eval(): number {
    return Math.max(this.valueA.eval(), this.valueB.eval());
  }
}

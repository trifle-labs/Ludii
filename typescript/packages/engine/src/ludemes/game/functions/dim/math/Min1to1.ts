/**
 * Min1to1.ts
 * @java game/functions/dim/math/Min.java
 *
 * Returns the minimum of two dim values.
 * Java key: "min" — already registered in ints1to1/math/Math1to1.ts.
 * This class is NOT registered (would clobber the existing "min" key).
 */

import type { DimFunction1to1 } from "../DimConstant1to1.js";

export class DimMin1to1 implements DimFunction1to1 {
  private readonly valueA: DimFunction1to1;
  private readonly valueB: DimFunction1to1;

  constructor(valueA: DimFunction1to1, valueB: DimFunction1to1) {
    this.valueA = valueA;
    this.valueB = valueB;
  }

  /** @java game/functions/dim/math/Min.java — eval() returns Math.min(valueA, valueB) */
  public eval(): number {
    return Math.min(this.valueA.eval(), this.valueB.eval());
  }
}

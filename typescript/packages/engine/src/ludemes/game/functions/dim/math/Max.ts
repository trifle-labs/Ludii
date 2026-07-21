/**
 * Max1to1.ts
 * @java game/functions/dim/math/Max.java
 *
 * Returns the maximum of two dim values.
 * Java key: "max" — already registered in ints1to1/math/Math1to1.ts.
 * This class is NOT registered (would clobber the existing "max" key).
 */

import type { DimFunction } from "../DimFunction.js";
import { BaseDimFunction } from "../BaseDimFunction.js";

export class DimMax extends BaseDimFunction {
  private readonly valueA: DimFunction;
  private readonly valueB: DimFunction;

  constructor(valueA: DimFunction, valueB: DimFunction) {
    super();
    this.valueA = valueA;
    this.valueB = valueB;
  }

  /** @java game/functions/dim/math/Max.java — eval() returns Math.max(valueA, valueB) */
  public eval(): number {
    return Math.max(this.valueA.eval(), this.valueB.eval());
  }
}

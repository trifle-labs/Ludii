/**
 * Min1to1.ts
 * @java game/functions/dim/math/Min.java
 *
 * Returns the minimum of two dim values.
 * Java key: "min" — already registered in ints1to1/math/Math1to1.ts.
 * This class is NOT registered (would clobber the existing "min" key).
 */

import type { DimFunction } from "../DimFunction.js";
import { BaseDimFunction } from "../BaseDimFunction.js";

export class DimMin extends BaseDimFunction {
  private readonly valueA: DimFunction;
  private readonly valueB: DimFunction;

  constructor(valueA: DimFunction, valueB: DimFunction) {
    super();
    this.valueA = valueA;
    this.valueB = valueB;
  }

  /** @java game/functions/dim/math/Min.java — eval() returns Math.min(valueA, valueB) */
  public eval(): number {
    return Math.min(this.valueA.eval(), this.valueB.eval());
  }
}

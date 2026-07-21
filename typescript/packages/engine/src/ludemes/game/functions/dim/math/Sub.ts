/**
 * Sub1to1.ts
 * @java game/functions/dim/math/Sub.java
 *
 * Returns the subtraction valueA minus valueB.
 * Java key alias: "-" — already registered in ints1to1/math/Math1to1.ts.
 * This class is NOT registered (would clobber the existing "-" key).
 */

import type { DimFunction } from "../DimFunction.js";
import { BaseDimFunction } from "../BaseDimFunction.js";

export class DimSub extends BaseDimFunction {
  private readonly valueA: DimFunction;
  private readonly valueB: DimFunction;

  constructor(valueA: DimFunction, valueB: DimFunction) {
    super();
    this.valueA = valueA;
    this.valueB = valueB;
  }

  /** @java game/functions/dim/math/Sub.java — eval() returns valueA - valueB */
  public eval(): number {
    return this.valueA.eval() - this.valueB.eval();
  }
}

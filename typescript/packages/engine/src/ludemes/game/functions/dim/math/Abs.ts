/**
 * Abs1to1.ts
 * @java game/functions/dim/math/Abs.java
 *
 * Returns the absolute value of a dim function.
 * Java key alias: "abs" — already registered in ints1to1/math/Math1to1.ts.
 * This class is NOT registered (would clobber the existing "abs" key).
 */

import type { DimFunction } from "../DimFunction.js";
import { BaseDimFunction } from "../BaseDimFunction.js";

export class DimAbs extends BaseDimFunction {
  private readonly value: DimFunction;

  constructor(value: DimFunction) {
    super();
    this.value = value;
  }

  /** @java game/functions/dim/math/Abs.java — eval() returns Math.abs(value.eval()) */
  public eval(): number {
    return Math.abs(this.value.eval());
  }
}

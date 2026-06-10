/**
 * Abs1to1.ts
 * @java game/functions/dim/math/Abs.java
 *
 * Returns the absolute value of a dim function.
 * Java key alias: "abs" — already registered in ints1to1/math/Math1to1.ts.
 * This class is NOT registered (would clobber the existing "abs" key).
 */

import type { DimFunction1to1 } from "../DimConstant1to1.js";

export class DimAbs implements DimFunction1to1 {
  private readonly value: DimFunction1to1;

  constructor(value: DimFunction1to1) {
    this.value = value;
  }

  /** @java game/functions/dim/math/Abs.java — eval() returns Math.abs(value.eval()) */
  public eval(): number {
    return Math.abs(this.value.eval());
  }
}

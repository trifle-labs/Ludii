/**
 * Pow1to1.ts
 * @java game/functions/dim/math/Pow.java
 *
 * Computes the first parameter to the power of the second.
 * Java key alias: "^" — already registered in ints1to1/math/PowCaret1to1.ts.
 * This class is NOT registered (would clobber the existing "^" key).
 */

import type { DimFunction1to1 } from "../DimConstant1to1.js";

export class DimPow1to1 implements DimFunction1to1 {
  private readonly a: DimFunction1to1;
  private readonly b: DimFunction1to1;

  constructor(a: DimFunction1to1, b: DimFunction1to1) {
    this.a = a;
    this.b = b;
  }

  /** @java game/functions/dim/math/Pow.java — eval() returns (int) Math.pow(a, b) */
  public eval(): number {
    return Math.trunc(Math.pow(this.a.eval(), this.b.eval()));
  }
}

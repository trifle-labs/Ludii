/**
 * Pow.ts
 * @java game/functions/dim/math/Pow.java
 *
 * Computes the first parameter to the power of the second.
 * Java key alias: "^" — already registered in ints1to1/math/PowCaret1to1.ts.
 * This class is NOT registered (would clobber the existing "^" key).
 */

import type { DimFunction } from "../DimFunction.js";
import { BaseDimFunction } from "../BaseDimFunction.js";

export class DimPow extends BaseDimFunction {
  private readonly a: DimFunction;
  private readonly b: DimFunction;

  constructor(a: DimFunction, b: DimFunction) {
    super();
    this.a = a;
    this.b = b;
  }

  /** @java game/functions/dim/math/Pow.java — eval() returns (int) Math.pow(a, b) */
  public eval(): number {
    return Math.trunc(Math.pow(this.a.eval(), this.b.eval()));
  }
}

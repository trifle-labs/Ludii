/**
 * Div1to1.ts
 * @java game/functions/dim/math/Div.java
 *
 * Divides dim value a by dim value b (integer division, rounds down).
 * Java key alias: "/" — already registered in ints1to1/math/Math1to1.ts.
 * This class is NOT registered (would clobber the existing "/" key).
 */

import type { DimFunction } from "../DimFunction.js";
import { BaseDimFunction } from "../BaseDimFunction.js";

export class DimDiv extends BaseDimFunction {
  private readonly a: DimFunction;
  private readonly b: DimFunction;

  constructor(a: DimFunction, b: DimFunction) {
    super();
    this.a = a;
    this.b = b;
  }

  /** @java game/functions/dim/math/Div.java — eval() returns a/b (integer division) */
  public eval(): number {
    const bv = this.b.eval();
    if (bv === 0) throw new Error("Division by zero.");
    return Math.trunc(this.a.eval() / bv);
  }
}

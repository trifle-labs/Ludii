/**
 * Div1to1.ts
 * @java game/functions/dim/math/Div.java
 *
 * Divides dim value a by dim value b (integer division, rounds down).
 * Java key alias: "/" — already registered in ints1to1/math/Math1to1.ts.
 * This class is NOT registered (would clobber the existing "/" key).
 */

import type { DimFunction1to1 } from "../DimConstant1to1.js";

export class DimDiv implements DimFunction1to1 {
  private readonly a: DimFunction1to1;
  private readonly b: DimFunction1to1;

  constructor(a: DimFunction1to1, b: DimFunction1to1) {
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

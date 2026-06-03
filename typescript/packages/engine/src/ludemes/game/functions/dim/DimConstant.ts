// @java Core/src/game/functions/dim/DimConstant.java

import { BaseDimFunction } from "./BaseDimFunction.js";

/**
 * Constant dim value.
 *
 * Java parity: @Hide final class extending BaseDimFunction. eval() returns
 * the stored constant integer. toString() returns String(a).
 *
 * @java game.functions.dim.DimConstant
 * @author Eric.Piette and cambolbro
 */
export class DimConstant extends BaseDimFunction {
  /** Constant value. @java DimConstant.a */
  private readonly a: number;

  /**
   * @java DimConstant(int a)
   * @param a The integer value.
   */
  public constructor(a: number) {
    super();
    this.a = a;
  }

  /** @java DimConstant.eval() — returns the constant */
  public eval(): number {
    return this.a;
  }

  /** @java DimConstant.toString() */
  public override toString(): string {
    return String(this.a);
  }
}

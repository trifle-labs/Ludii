/**
 * DimConstant1to1.ts
 * @java game/functions/dim/DimConstant.java
 *
 * A constant integer dim value. In Java this is @Hide (no lud head),
 * used internally by dim math constructors to wrap literal integers.
 */

/** @java game/functions/dim/DimFunction.java — eval(): number */
export interface DimFunction1to1 {
  eval(): number;
}

/**
 * Constant dim value.
 * @java game/functions/dim/DimConstant.java
 */
export class DimConstant1to1 implements DimFunction1to1 {
  private readonly a: number;

  constructor(a: number) {
    this.a = a;
  }

  /** @java game/functions/dim/DimConstant.java — eval() returns a */
  public eval(): number {
    return this.a;
  }
}

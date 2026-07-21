// @java Common/src/main/grammar/Combo.java

/**
 * Combination for assigning null and non-null arguments in parameter lists.
 *
 * @java main/grammar/Combo.java
 * @author cambolbro
 */
export class Combo {
  /** @java Combo.array */
  private readonly arrayVal: number[];

  /** @java Combo.count */
  private readonly countVal: number;

  // --------------------------------------------------------------------------

  /**
   * @param n    Total number of bits (parameters).
   * @param seed Bitmask determining which positions are "on".
   * @java Combo(int, int)
   */
  public constructor(n: number, seed: number) {
    this.arrayVal = new Array<number>(n).fill(0);

    let on = 0;
    for (let b = 0; b < n; b++) {
      if ((seed & (0x1 << b)) !== 0) {
        this.arrayVal[b] = ++on;
      }
    }
    this.countVal = on;
  }

  // --------------------------------------------------------------------------

  /** @java Combo.array() */
  public array(): number[] {
    return this.arrayVal;
  }

  // --------------------------------------------------------------------------

  /**
   * @return Total length of combo including on-bits and off-bits.
   * @java Combo.length()
   */
  public length(): number {
    return this.arrayVal.length;
  }

  /**
   * @return Number of on-bits.
   * @java Combo.count()
   */
  public count(): number {
    return this.countVal;
  }

  // --------------------------------------------------------------------------
}

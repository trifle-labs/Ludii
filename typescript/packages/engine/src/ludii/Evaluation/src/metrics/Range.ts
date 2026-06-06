// @java Evaluation/src/metrics/Range.java

/**
 * Defines two values of a specified type.
 *
 * @java metrics/Range.java
 * @author cambolbro
 */
export class Range<E1, E2> {

  /** @java Range.min */
  private readonly _min: E1;

  /** @java Range.max */
  private readonly _max: E2;

  //-------------------------------------------------------------------------

  /**
   * @java Range(E1, E2)
   */
  public constructor(min: E1, max: E2) {
    this._min = min;
    this._max = max;
  }

  //-------------------------------------------------------------------------

  /** @java Range.min() */
  public min(): E1 {
    return this._min;
  }

  /** @java Range.max() */
  public max(): E2 {
    return this._max;
  }

  //-------------------------------------------------------------------------
}

// @java Language/src/parser/TokenRange.java

/**
 * Specifies a token's range within a String.
 *
 * @java parser/TokenRange.java
 * @author cambolbro
 */
export class TokenRange {
  /** @java TokenRange.from */
  readonly from: number;

  /** @java TokenRange.to */
  readonly to: number;

  // -------------------------------------------------------------------------

  /**
   * @param from Range from (inclusive).
   * @param to   Range to (exclusive).
   * @java TokenRange(int, int)
   */
  public constructor(from: number, to: number) {
    this.from = from;
    this.to   = to;
  }

  // -------------------------------------------------------------------------

  /**
   * @java TokenRange.from()
   */
  public getFrom(): number {
    return this.from;
  }

  /**
   * @java TokenRange.to()
   */
  public getTo(): number {
    return this.to;
  }

  // -------------------------------------------------------------------------
}

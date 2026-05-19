/**
 * Ported from `Language/src/parser/TokenRange.java`.
 *
 * Specifies a token's range within a string. The Java original stores
 * `from` (inclusive) and `to` (exclusive) and exposes them as accessor
 * methods. The TS port mirrors the API exactly so callers ported from
 * the parser can use `range.from()` / `range.to()` unchanged.
 */
export class TokenRange {
  private readonly _from: number;
  private readonly _to: number;

  /**
   * @param from Range from (inclusive).
   * @param to   Range to (exclusive).
   */
  public constructor(from: number, to: number) {
    this._from = from;
    this._to = to;
  }

  /** @return Range from (inclusive). */
  public from(): number {
    return this._from;
  }

  /** @return Range to (exclusive). */
  public to(): number {
    return this._to;
  }
}

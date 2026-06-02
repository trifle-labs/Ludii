// @java Core/src/metadata/ai/misc/Pair.java

/**
 * Defines a pair of a String and a floating point value. Typically used
 * in AI metadata to assign a numeric value (such as a heuristic score, or
 * some other weight) to a specific piece name.
 *
 * @author Dennis Soemers
 */
export class Pair {
  protected readonly _key: string;
  protected readonly _floatVal: number;

  /**
   * @param key The String value.
   * @param floatVal The floating point value.
   *
   * @example (pair "Pawn" 1.0)
   */
  constructor(key: string, floatVal: number) {
    this._key = key;
    this._floatVal = floatVal;
  }

  /** @return Our key */
  key(): string {
    return this._key;
  }

  /** @return Our float value */
  floatVal(): number {
    return this._floatVal;
  }

  toString(): string {
    return `(pair "${this._key}" ${this._floatVal})`;
  }

  hashCode(): number {
    // Simple Java-style hashCode approximation
    let result = 1;
    const floatBits = this._floatVal;
    result = (31 * result + floatBits) | 0;
    let h = 0;
    for (let i = 0; i < this._key.length; i++) {
      h = (Math.imul(31, h) + this._key.charCodeAt(i)) | 0;
    }
    result = (31 * result + (this._key == null ? 0 : h)) | 0;
    return result;
  }

  equals(obj: unknown): boolean {
    if (this === obj) return true;
    if (!(obj instanceof Pair)) return false;
    const other = obj as Pair;
    if (this._floatVal !== other._floatVal) return false;
    return this._key === other._key;
  }
}

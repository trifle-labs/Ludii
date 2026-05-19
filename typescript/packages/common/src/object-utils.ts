/**
 * Small set of value-semantics helpers shared by the TypeScript ports.
 *
 * They are deliberately conservative: they recognise the structural-equality
 * and hash-code conventions Java enforces through `Object`, but they do not
 * try to coerce arbitrary JavaScript values into Java-style identity.
 */

/**
 * Thrown when a structural mutation is detected while a fail-fast operation
 * is in progress. Mirrors `java.util.ConcurrentModificationException`.
 */
export class ConcurrentModificationException extends Error {
  public constructor(message = "Concurrent modification detected") {
    super(message);
    this.name = "ConcurrentModificationException";
  }
}

/**
 * Two values are considered equal if they are referentially identical or if
 * the left operand exposes an `equals(other)` method that returns `true` for
 * the right operand. Matches `Objects.equals(a, b)` from the JDK.
 */
export function defaultEquals(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (a === null || a === undefined || b === null || b === undefined) {
    return false;
  }
  const equalsFn = (a as { equals?: (other: unknown) => boolean }).equals;
  if (typeof equalsFn === "function") {
    return equalsFn.call(a, b);
  }
  return false;
}

/**
 * Java-compatible hash code for the small subset of types the ports actually
 * need to round-trip:
 *
 * - `null` / `undefined` → 0
 * - objects exposing `.hashCode()` → that result, narrowed to a 32-bit int
 * - numbers → truncated to a 32-bit signed int (matches `Integer.hashCode`)
 * - strings → Java's `String.hashCode()` algorithm
 * - booleans → `1231` for `true`, `1237` for `false` (Java's `Boolean.hashCode`)
 *
 * Anything else returns 0 so callers can still rely on a stable contract.
 */
export function defaultHashCode(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const fn = (value as { hashCode?: () => number }).hashCode;
  if (typeof fn === "function") {
    return fn.call(value) | 0;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value | 0 : 0;
  }
  if (typeof value === "string") {
    let hash = 0;
    for (let i = 0; i < value.length; ++i) {
      hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
    }
    return hash;
  }
  if (typeof value === "boolean") {
    return value ? 1231 : 1237;
  }
  return 0;
}

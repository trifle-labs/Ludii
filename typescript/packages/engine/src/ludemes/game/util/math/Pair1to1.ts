/**
 * Pair1to1.ts
 * @java game/util/math/Pair.java
 *
 * Defines a pair of two integers, two strings, or one integer and a string.
 * Used for the (map ...) ludeme's entry list.
 *
 * This is a data class — no eval(ctx). The map ludeme reads intKey/intValue
 * or stringKey/stringValue at eval time.
 */

import type { IntFunction } from "../../../base.js";

/** Sentinel IntFunction returning UNDEFINED (-1). */
const UNDEFINED_INT: IntFunction = { eval(_ctx) { return -1; } };

/**
 * Defines a pair of two integers, two strings or one integer and a string.
 * @java game/util/math/Pair.java
 * @remarks Used for the map ludeme.
 */
export class Pair1to1 {
  /** @java Pair.intKey — the integer key of the pair. */
  private readonly intKeyFn: IntFunction | null;

  /** @java Pair.stringKey — the string key of the pair. */
  private readonly strKey: string | null;

  /** @java Pair.intValue — the integer value of the pair. */
  private readonly intValueFn: IntFunction | null;

  /** @java Pair.stringValue — the string value of the pair. */
  private readonly strValue: string | null;

  /**
   * @java game/util/math/Pair.java — constructor variants
   *
   * All four variants reduce to storing optional intKey, strKey, intValue, strValue.
   */
  public constructor(opts: {
    intKeyFn?: IntFunction | null;
    strKey?: string | null;
    intValueFn?: IntFunction | null;
    strValue?: string | null;
  }) {
    this.intKeyFn = opts.intKeyFn ?? null;
    this.strKey = opts.strKey ?? null;
    this.intValueFn = opts.intValueFn ?? null;
    this.strValue = opts.strValue ?? null;
  }

  /**
   * @java Pair.intValue()
   * Returns the integer value IntFunction. Falls back to UNDEFINED (-1) if null.
   */
  public intValue(): IntFunction {
    return this.intValueFn ?? UNDEFINED_INT;
  }

  /**
   * @java Pair.intKey()
   * Returns the integer key IntFunction. Falls back to UNDEFINED (-1) if null.
   */
  public intKey(): IntFunction {
    return this.intKeyFn ?? UNDEFINED_INT;
  }

  /** @java Pair.stringValue() */
  public stringValue(): string | null {
    return this.strValue;
  }

  /** @java Pair.stringKey() */
  public stringKey(): string | null {
    return this.strKey;
  }
}

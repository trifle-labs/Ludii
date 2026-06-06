// @java Core/src/game/functions/ints/value/Value.java

/**
 * Returns the value of the specified property.
 *
 * @java game/functions/ints/value/Value.java
 * @author Eric Piette
 *
 * @remarks This is a static-factory-only dispatcher class. Its eval() should
 *          never be called directly — all real work is done by the concrete
 *          subclasses returned by the construct() overloads.
 */

import { BaseIntFunction } from "../BaseIntFunction.js";
import type { Context } from "../../../../../context.js";

/**
 * Root Value class — should never have eval() called on it directly.
 * Mirrors Java Value which throws UnsupportedOperationException from eval().
 *
 * @java game/functions/ints/value/Value.java
 */
export class Value extends BaseIntFunction {
  /**
   * Private constructor — Value is a static-factory-only class in Java.
   * @java Value() — private
   */
  private constructor() {
    super();
  }

  /**
   * @java Value.eval(Context) — throws UnsupportedOperationException
   * Should not be called; dispatch always goes to a concrete subtype.
   */
  public override eval(_context: Context): number {
    // Should not be called, should only be called on subclasses
    throw new Error("Value.eval(): Should never be called directly.");
  }

  /** @java Value.isStatic() — should never be reached */
  public isStatic(): boolean {
    // Should never be there
    return false;
  }
}

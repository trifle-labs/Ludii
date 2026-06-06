// @java Core/src/game/functions/ints/last/Last.java

/**
 * Returns a site related to the last move.
 *
 * @java game/functions/ints/last/Last.java
 * @author Eric Piette
 *
 * @remarks This is a static-factory-only dispatcher class. Its eval() should
 *          never be called directly — all real work is done by the concrete
 *          subclasses (LastFrom, LastLevelFrom, LastTo, LastLevelTo) returned by
 *          the construct() factory.
 */

import { BaseIntFunction } from "../BaseIntFunction.js";
import type { Context } from "../../../../../context.js";

/**
 * Root Last class — should never have eval() called on it directly.
 * Mirrors Java Last which throws UnsupportedOperationException from eval().
 *
 * @java game/functions/ints/last/Last.java
 */
export class Last extends BaseIntFunction {
  /**
   * Private constructor — Last is a static-factory-only class in Java.
   * @java Last() — private
   */
  private constructor() {
    super();
  }

  /**
   * @java Last.eval(Context) — throws UnsupportedOperationException
   * Should not be called; dispatch always goes to a concrete subtype.
   */
  public override eval(_context: Context): number {
    // Should not be called, should only be called on subclasses
    throw new Error("Last.eval(): Should never be called directly.");
  }

  /** @java Last.isStatic() — should never be reached */
  public isStatic(): boolean {
    // Should never be there
    return false;
  }
}

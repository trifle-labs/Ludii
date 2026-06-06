// @java Core/src/game/functions/ints/count/Count.java

/**
 * Root dispatcher for Count ludeme — routes to concrete subtype classes.
 *
 * Java Count is a static-factory-only class: its private constructor and
 * concrete eval() throw UnsupportedOperationException. All real work is done
 * by the classes instantiated in construct(...) overloads. This TS module
 * mirrors that: it does NOT register an "int:count" key; the compiler1to1
 * dispatches through compound keys such as "count:Pieces", "count:Sites", etc.
 *
 * @java game/functions/ints/count/Count.java
 * @author Eric Piette
 */

import { BaseIntFunction } from "../BaseIntFunction.js";
import type { Context } from "../../../../../context.js";

/**
 * Root Count class — should never have eval() called on it directly.
 * Mirrors Java Count which throws UnsupportedOperationException from eval().
 *
 * @java game/functions/ints/count/Count.java
 */
export class Count extends BaseIntFunction {
  /**
   * Private constructor — Count is a static-factory-only class in Java.
   * @java Count() — private
   */
  private constructor() {
    super();
  }

  /**
   * @java Count.eval(Context) — throws UnsupportedOperationException
   * Should not be called; dispatch always goes to a concrete subtype.
   */
  public override eval(_context: Context): number {
    throw new Error("Count.eval(): Should never be called directly.");
  }

  /** @java Count.isStatic() — should never be reached */
  public isStatic(): boolean {
    return false;
  }
}

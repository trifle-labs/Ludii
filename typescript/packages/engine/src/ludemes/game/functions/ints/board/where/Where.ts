// @java Core/src/game/functions/ints/board/where/Where.java

/**
 * Returns the site (or level) of a piece if it is on the board/site, else OFF (-1).
 *
 * @java game/functions/ints/board/where/Where.java
 * @author Eric.Piette
 *
 * @remarks This is a static-factory-only dispatcher class. Its eval() should
 *          never be called directly — all real work is done by the concrete
 *          subclasses (WhereSite, WhereLevel) returned by the construct() overloads.
 */

import { BaseIntFunction } from "../../BaseIntFunction.js";
import type { Context } from "../../../../../../context.js";

/**
 * Root Where class — should never have eval() called on it directly.
 * Mirrors Java Where which throws UnsupportedOperationException from eval().
 *
 * @java game/functions/ints/board/where/Where.java
 */
export class Where extends BaseIntFunction {
  /**
   * Private constructor — Where is a static-factory-only class in Java.
   * @java Where() — private
   */
  private constructor() {
    super();
  }

  /**
   * @java Where.eval(Context) — throws UnsupportedOperationException
   * Should not be called; dispatch always goes to a concrete subtype.
   */
  public override eval(_context: Context): number {
    // Should not be called, should only be called on subclasses
    throw new Error("Count.eval(): Should never be called directly.");
  }

  /** @java Where.isStatic() — should never be reached */
  public isStatic(): boolean {
    // Should never be there
    return false;
  }
}

// @java Core/src/game/functions/booleans/is/Is.java

import type { Context } from "../../../../../context.js";
import { BaseBooleanFunction } from "../BaseBooleanFunction.js";

/**
 * Returns whether the specified query about the game state is true or not.
 *
 * Java parity: `Is` is a pure dispatcher — all logic lives in subclasses.
 * Its own `eval()` throws, matching the Java UnsupportedOperationException.
 * Concrete callers should never call `new Is()` or `Is.eval()` directly;
 * instead they call one of the static `construct()` factories, which return
 * a concrete BooleanFunction subclass instance.
 *
 * @java game/functions/booleans/is/Is.java
 * @author Eric.Piette and cambolbro
 */
export class Is extends BaseBooleanFunction {
  /**
   * Private constructor — this class is a pure static factory.
   * @java Is() private constructor
   */
  private constructor() {
    super();
    // Ensure that compiler does not pick up default constructor
  }

  /**
   * @java Is.eval(Context)
   * Should not be called; should only be called on subclasses.
   */
  public override eval(_context: Context): boolean {
    // Should not be called, should only be called on subclasses
    throw new Error("Is.eval(): Should never be called directly.");
  }

  /** @java Is.isStatic() */
  public override isStatic(): boolean {
    // Should never be there
    return false;
  }

  /** @java Is.gameFlags(Game) */
  public override gameFlags(_game: unknown): number {
    // Should never be there
    return 0;
  }

  /** @java Is.preprocess(Game) */
  public override preprocess(_game: unknown): void {
    // Nothing to do.
  }
}

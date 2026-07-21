// @java Core/src/game/functions/ints/value/simple/ValueMoveLimit.java

/**
 * Returns the internal move limit of the game.
 *
 * @java game/functions/ints/value/simple/ValueMoveLimit.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";

/**
 * Returns the internal move limit of the game.
 *
 * @java game/functions/ints/value/simple/ValueMoveLimit.java
 */
export class ValueMoveLimit extends BaseIntFunction {
  /**
   * @java ValueMoveLimit()
   */
  public constructor() {
    super();
    // Nothing to do
  }

  /**
   * @java ValueMoveLimit.eval(Context)
   */
  public override eval(context: Context): number {
    return (context.game as unknown as { getMaxMoveLimit(): number }).getMaxMoveLimit();
  }

  /** @java ValueMoveLimit.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java ValueMoveLimit.gameFlags(Game) */
  public override concepts(_game: unknown): Set<number> {
    return new Set();
  }

  /** @java ValueMoveLimit.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    return new Set();
  }

  /** @java ValueMoveLimit.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    return new Set();
  }

  /** @java ValueMoveLimit.preprocess(Game) */
  public preprocess(_game: unknown): void {
    // Nothing to do
  }

  /** @java ValueMoveLimit.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "the move limit";
  }
}

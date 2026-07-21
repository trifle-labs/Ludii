// @java Core/src/game/functions/ints/value/simple/ValueTurnLimit.java

/**
 * Returns the internal turn limit of the game.
 *
 * @java game/functions/ints/value/simple/ValueTurnLimit.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";

/**
 * Returns the internal turn limit of the game.
 *
 * @java game/functions/ints/value/simple/ValueTurnLimit.java
 */
export class ValueTurnLimit extends BaseIntFunction {
  /**
   * @java ValueTurnLimit()
   */
  public constructor() {
    super();
    // Nothing to do
  }

  /**
   * @java ValueTurnLimit.eval(Context)
   */
  public override eval(context: Context): number {
    return (context.game as unknown as { getMaxTurnLimit(): number }).getMaxTurnLimit();
  }

  /** @java ValueTurnLimit.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java ValueTurnLimit.gameFlags(Game) */
  public override concepts(_game: unknown): Set<number> {
    return new Set();
  }

  /** @java ValueTurnLimit.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    return new Set();
  }

  /** @java ValueTurnLimit.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    return new Set();
  }

  /** @java ValueTurnLimit.preprocess(Game) */
  public preprocess(_game: unknown): void {
    // Nothing to do
  }

  /** @java ValueTurnLimit.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "the turn limit";
  }
}

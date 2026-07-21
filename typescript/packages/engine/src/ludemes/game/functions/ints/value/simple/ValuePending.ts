// @java Core/src/game/functions/ints/value/simple/ValuePending.java

/**
 * Returns the pending value if the previous state causes the current state to
 * be pending with a specific value.
 *
 * @java game/functions/ints/value/simple/ValuePending.java
 * @author Eric.Piette
 * @remarks To store a temporary value in the state for one move turn. Returns 0
 *          if there are multiple different pending values or no pending value.
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";
import { GameType } from "../../../../types/state/GameType.js";

/**
 * Returns the pending value if the previous state causes the current state to
 * be pending with a specific value.
 *
 * @java game/functions/ints/value/simple/ValuePending.java
 */
export class ValuePending extends BaseIntFunction {
  /**
   * @java ValuePending()
   */
  public constructor() {
    super();
    // Nothing to do
  }

  /**
   * @java ValuePending.eval(Context)
   *
   * pendingValues should mathematically be a set, so if it contains
   * more than 1 value we don't know what to return and just return
   * the default of 0 instead.
   */
  public override eval(context: Context): number {
    const pendingValues = context.state.pending;
    // Java: if (context.state().pendingValues().size() == 1) return context.state().pendingValues().iterator().next();
    if (pendingValues.size === 1) {
      return pendingValues.values().next().value as number;
    }
    return 0;
  }

  /** @java ValuePending.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /**
   * @java ValuePending.gameFlags(Game)
   * Returns GameType.PendingValues flag.
   */
  public gameFlags(_game: unknown): bigint {
    return GameType.PendingValues;
  }

  /** @java ValuePending.concepts(Game) */
  public override concepts(_game: unknown): Set<number> {
    return new Set();
  }

  /** @java ValuePending.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    return new Set();
  }

  /** @java ValuePending.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    return new Set();
  }

  /** @java ValuePending.preprocess(Game) */
  public preprocess(_game: unknown): void {
    // Nothing to do
  }

  /** @java ValuePending.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "the pending value";
  }
}

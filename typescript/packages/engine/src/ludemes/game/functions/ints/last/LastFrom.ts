// @java Core/src/game/functions/ints/last/LastFrom.java

/**
 * Returns the "from" location of the last decision.
 *
 * @java game/functions/ints/last/LastFrom.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import { BooleanConstant } from "../../booleans/BooleanConstant.js";
import { BaseBooleanFunction } from "../../booleans/BaseBooleanFunction.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Returns the "from" location of the last decision.
 *
 * @java game/functions/ints/last/LastFrom.java
 */
export class LastFrom extends BaseIntFunction {
  /** @java LastFrom.afterSubsequentsFn */
  private readonly afterSubsequentsFn: BaseBooleanFunction;

  /**
   * @param afterSubsequents Whether to return the "from" location after
   *                         applying the consequences [False].
   * @java LastFrom(BooleanFunction)
   */
  public constructor(afterSubsequents?: BaseBooleanFunction) {
    super();
    this.afterSubsequentsFn =
      afterSubsequents !== undefined && afterSubsequents !== null
        ? afterSubsequents
        : new BooleanConstant(false);
  }

  /**
   * @java LastFrom.eval(Context)
   *
   * Returns the "from" site of the last move in the trial.
   * If afterSubsequentsFn is true, uses fromAfterSubsequents(); otherwise fromNonDecision().
   */
  public override eval(context: Context): number {
    // Java: final Move action = context.trial().lastMove();
    const action = context.trial.lastMove();
    if (action !== null && action !== undefined) {
      if (this.afterSubsequentsFn.eval(context)) {
        // Java: return action.fromAfterSubsequents();
        const m = action as unknown as { fromAfterSubsequents?: () => number };
        return typeof m.fromAfterSubsequents === "function"
          ? m.fromAfterSubsequents()
          : action.from();
      } else {
        // Java: return action.fromNonDecision();
        return action.fromNonDecision();
      }
    }
    return UNDEFINED;
  }

  /** @java LastFrom.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java LastFrom.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    return this.afterSubsequentsFn.writesEvalContextRecursive();
  }

  /** @java LastFrom.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    return this.afterSubsequentsFn.readsEvalContextRecursive();
  }

  /** @java LastFrom.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    return this.afterSubsequentsFn.missingRequirement(game);
  }

  /** @java LastFrom.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    return this.afterSubsequentsFn.willCrash(game);
  }

  /** @java LastFrom.preprocess(Game) */
  public preprocess(game: unknown): void {
    this.afterSubsequentsFn.preprocess(game);
  }

  /** @java LastFrom.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "the from location of the last move";
  }
}

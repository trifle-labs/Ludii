// @java Core/src/game/functions/ints/last/LastLevelTo.java

/**
 * Returns the "level to" of the last move.
 *
 * @java game/functions/ints/last/LastLevelTo.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import { BooleanConstant } from "../../booleans/BooleanConstant.js";
import { BaseBooleanFunction } from "../../booleans/BaseBooleanFunction.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Returns the "level to" of the last move.
 *
 * @java game/functions/ints/last/LastLevelTo.java
 */
export class LastLevelTo extends BaseIntFunction {
  /** @java LastLevelTo.afterSubsequentsFn */
  private readonly afterSubsequentsFn: BaseBooleanFunction;

  /**
   * @param afterSubsequents Whether to return the "level" after applying
   *                         subsequents [False].
   * @java LastLevelTo(BooleanFunction)
   */
  public constructor(afterSubsequents?: BaseBooleanFunction) {
    super();
    this.afterSubsequentsFn =
      afterSubsequents !== undefined && afterSubsequents !== null
        ? afterSubsequents
        : new BooleanConstant(false);
  }

  /**
   * @java LastLevelTo.eval(Context)
   *
   * Returns the "level to" of the last move.
   * If afterSubsequentsFn is true, uses levelToAfterSubsequents(); else levelTo().
   */
  public override eval(context: Context): number {
    // Java: final Move action = context.trial().lastMove();
    const action = context.trial.lastMove();
    if (action !== null && action !== undefined) {
      if (this.afterSubsequentsFn.eval(context)) {
        // Java: return action.levelToAfterSubsequents();
        const m = action as unknown as { levelToAfterSubsequents?: () => number };
        return typeof m.levelToAfterSubsequents === "function"
          ? m.levelToAfterSubsequents()
          : UNDEFINED;
      } else {
        // Java: return action.levelTo();
        const m = action as unknown as { levelTo?: () => number };
        return typeof m.levelTo === "function"
          ? m.levelTo()
          : UNDEFINED;
      }
    }
    return UNDEFINED;
  }

  /** @java LastLevelTo.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java LastLevelTo.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    return this.afterSubsequentsFn.writesEvalContextRecursive();
  }

  /** @java LastLevelTo.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    return this.afterSubsequentsFn.readsEvalContextRecursive();
  }

  /** @java LastLevelTo.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    return this.afterSubsequentsFn.missingRequirement(game);
  }

  /** @java LastLevelTo.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    return this.afterSubsequentsFn.willCrash(game);
  }

  /** @java LastLevelTo.preprocess(Game) */
  public preprocess(game: unknown): void {
    this.afterSubsequentsFn.preprocess(game);
  }

  /** @java LastLevelTo.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "the level to location of the last move";
  }
}

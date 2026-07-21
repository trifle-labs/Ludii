// @java Core/src/game/functions/ints/last/LastLevelFrom.java

/**
 * Returns the "level from" of the last move.
 *
 * @java game/functions/ints/last/LastLevelFrom.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import { BooleanConstant } from "../../booleans/BooleanConstant.js";
import { BaseBooleanFunction } from "../../booleans/BaseBooleanFunction.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Returns the "level from" of the last move.
 *
 * @java game/functions/ints/last/LastLevelFrom.java
 */
export class LastLevelFrom extends BaseIntFunction {
  /** @java LastLevelFrom.afterSubsequentsFn */
  private readonly afterSubsequentsFn: BaseBooleanFunction;

  /**
   * @param afterSubsequents Whether to return the "level" after applying
   *                         subsequents [False].
   * @java LastLevelFrom(BooleanFunction)
   */
  public constructor(afterSubsequents?: BaseBooleanFunction) {
    super();
    this.afterSubsequentsFn =
      afterSubsequents !== undefined && afterSubsequents !== null
        ? afterSubsequents
        : new BooleanConstant(false);
  }

  /**
   * @java LastLevelFrom.eval(Context)
   *
   * Returns the "level from" of the last move.
   * If afterSubsequentsFn is true, uses levelFromAfterSubsequents(); else levelFrom().
   */
  public override eval(context: Context): number {
    // Java: final Move action = context.trial().lastMove();
    const action = context.trial.lastMove();
    if (action !== null && action !== undefined) {
      if (this.afterSubsequentsFn.eval(context)) {
        // Java: return action.levelFromAfterSubsequents();
        const m = action as unknown as { levelFromAfterSubsequents?: () => number };
        return typeof m.levelFromAfterSubsequents === "function"
          ? m.levelFromAfterSubsequents()
          : UNDEFINED;
      } else {
        // Java: return action.levelFrom();
        const m = action as unknown as { levelFrom?: () => number };
        return typeof m.levelFrom === "function"
          ? m.levelFrom()
          : UNDEFINED;
      }
    }
    return UNDEFINED;
  }

  /** @java LastLevelFrom.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java LastLevelFrom.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    return this.afterSubsequentsFn.writesEvalContextRecursive();
  }

  /** @java LastLevelFrom.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    return this.afterSubsequentsFn.readsEvalContextRecursive();
  }

  /** @java LastLevelFrom.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    return this.afterSubsequentsFn.missingRequirement(game);
  }

  /** @java LastLevelFrom.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    return this.afterSubsequentsFn.willCrash(game);
  }

  /** @java LastLevelFrom.preprocess(Game) */
  public preprocess(game: unknown): void {
    this.afterSubsequentsFn.preprocess(game);
  }

  /** @java LastLevelFrom.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "the level from location of the last move";
  }
}

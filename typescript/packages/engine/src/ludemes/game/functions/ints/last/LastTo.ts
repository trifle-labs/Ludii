// @java Core/src/game/functions/ints/last/LastTo.java

/**
 * Returns the "to" location of the last decision.
 *
 * @java game/functions/ints/last/LastTo.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import { BooleanConstant } from "../../booleans/BooleanConstant.js";
import { BaseBooleanFunction } from "../../booleans/BaseBooleanFunction.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Returns the "to" location of the last decision.
 *
 * @java game/functions/ints/last/LastTo.java
 */
export class LastTo extends BaseIntFunction {
  /** @java LastTo.afterSubsequentsFn */
  private readonly afterSubsequentsFn: BaseBooleanFunction;

  /**
   * @param afterSubsequents Whether to return the "to" location after applying
   *                         the consequences [False].
   * @java LastTo(BooleanFunction)
   */
  public constructor(afterSubsequents?: BaseBooleanFunction) {
    super();
    this.afterSubsequentsFn =
      afterSubsequents !== undefined && afterSubsequents !== null
        ? afterSubsequents
        : new BooleanConstant(false);
  }

  /**
   * @java LastTo.eval(Context)
   *
   * Returns the "to" site of the last move in the trial.
   * If afterSubsequentsFn is true, uses toAfterSubsequents(); else toNonDecision().
   */
  public override eval(context: Context): number {
    // Java: final Move move = context.trial().lastMove();
    const move = context.trial.lastMove();
    if (this.afterSubsequentsFn.eval(context)) {
      // Java: if (move == null) return Constants.UNDEFINED; return move.toAfterSubsequents();
      if (move === null || move === undefined) return UNDEFINED;
      const m = move as unknown as { toAfterSubsequents?: () => number };
      return typeof m.toAfterSubsequents === "function"
        ? m.toAfterSubsequents()
        : move.to();
    } else {
      // Java: if (move == null) return Constants.UNDEFINED; return move.toNonDecision();
      if (move === null || move === undefined) return UNDEFINED;
      return move.toNonDecision();
    }
  }

  /** @java LastTo.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java LastTo.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    return this.afterSubsequentsFn.writesEvalContextRecursive();
  }

  /** @java LastTo.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    return this.afterSubsequentsFn.readsEvalContextRecursive();
  }

  /** @java LastTo.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    return this.afterSubsequentsFn.missingRequirement(game);
  }

  /** @java LastTo.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    return this.afterSubsequentsFn.willCrash(game);
  }

  /** @java LastTo.preprocess(Game) */
  public preprocess(game: unknown): void {
    this.afterSubsequentsFn.preprocess(game);
  }

  /** @java LastTo.toString() */
  public override toString(): string {
    return "(LastTo)";
  }

  /** @java LastTo.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "the to location of the last move";
  }
}

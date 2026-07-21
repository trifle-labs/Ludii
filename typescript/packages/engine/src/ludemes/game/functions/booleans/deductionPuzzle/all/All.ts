// @java Core/src/game/functions/booleans/deductionPuzzle/all/All.java

/**
 * Whether the specified query is all true for a deduction puzzle.
 * Factory class that dispatches on AllPuzzleType.
 *
 * @java game.functions.booleans.deductionPuzzle.all.All
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction, RegionFunction } from "../../../../../base.js";
import { BaseBooleanFunction } from "../../BaseBooleanFunction.js";
import type { SiteType } from "../../../../../../action/site-type.js";
import { AllPuzzleType } from "./AllPuzzleType.js";
import { AllDifferent } from "./AllDifferent.js";

/**
 * Factory / dispatch class. Calling `All.construct(...)` returns the
 * appropriate sub-class instance. The `eval` on `All` itself should never
 * be called directly (matches Java behaviour).
 *
 * @java game.functions.booleans.deductionPuzzle.all.All
 */
export class All extends BaseBooleanFunction {
  // Private constructor: use All.construct().
  private constructor() {
    super();
  }

  /**
   * @java All.construct(AllPuzzleType, SiteType, RegionFunction, IntFunction, IntFunction[])
   *
   * @example (all Different)
   * @example (all Different except:0)
   */
  public static construct(
    allType: AllPuzzleType,
    elementType: SiteType | null = null,
    region: RegionFunction | null = null,
    except: IntFunction | null = null,
    excepts: readonly IntFunction[] | null = null,
  ): BaseBooleanFunction {
    let numNonNull = 0;
    if (except != null) numNonNull++;
    if (excepts != null) numNonNull++;
    if (numNonNull > 1) {
      throw new Error(
        "All(): With AllPuzzleType zero or one except or excepts parameter must be non-null.",
      );
    }

    switch (allType) {
      case AllPuzzleType.Different:
        return new AllDifferent(elementType, region, except, excepts ?? null);
      default:
        throw new Error("All(): A AllPuzzleType is not implemented.");
    }
  }

  // ---- BaseBooleanFunction stubs -----------------------------------------

  /** @java All.isStatic() — should never be called */
  public override isStatic(): boolean {
    return false;
  }

  /** @java All.gameFlags(Game) — should never be called */
  public override gameFlags(_game: unknown): number {
    return 0;
  }

  /** @java All.preprocess(Game) — nothing to do */
  public override preprocess(_game: unknown): void {
    // Nothing to do.
  }

  /**
   * @java All.eval(Context) — should never be called directly.
   */
  public override eval(_context: Context): boolean {
    throw new Error(
      "All.eval(): Should never be called directly.",
    );
  }

  /** @java All.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "all of the following is true:";
  }
}

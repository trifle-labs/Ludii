// @java Core/src/game/functions/booleans/deductionPuzzle/is/Is.java

/**
 * Whether the specified query is true for a deduction puzzle.
 * Factory class that dispatches on IsPuzzle*Type.
 *
 * @java game.functions.booleans.deductionPuzzle.is.Is
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction, RegionFunction } from "../../../../../base.js";
import { BaseBooleanFunction } from "../../BaseBooleanFunction.js";
import type { SiteType } from "../../../../../../action/site-type.js";
import { IsPuzzleSimpleType } from "./IsPuzzleSimpleType.js";
import { IsPuzzleGraphType } from "./IsPuzzleGraphType.js";
import { IsPuzzleRegionResultType } from "./IsPuzzleRegionResultType.js";
import { IsSolved } from "./simple/IsSolved.js";
import { IsUnique } from "./graph/IsUnique.js";
import { IsCount } from "./regionResult/IsCount.js";
import { IsSum } from "./regionResult/IsSum.js";

/**
 * Factory / dispatch class. Calling one of the `Is.construct` overloads
 * returns the appropriate sub-class instance. The `eval` on `Is` itself
 * should never be called directly (matches Java behaviour).
 *
 * @java game.functions.booleans.deductionPuzzle.is.Is
 */
export class Is extends BaseBooleanFunction {
  // Private constructor: use Is.construct*().
  private constructor() {
    super();
  }

  // ---- Factory overloads -------------------------------------------------

  /**
   * For solving a puzzle.
   * @java Is.construct(IsPuzzleSimpleType)
   * @example (is Solved)
   */
  public static constructSimple(
    isType: IsPuzzleSimpleType,
  ): BaseBooleanFunction {
    switch (isType) {
      case IsPuzzleSimpleType.Solved:
        return new IsSolved();
      default:
        throw new Error("Is(): A IsPuzzleSimpleType is not implemented.");
    }
  }

  /**
   * For the unique constraint.
   * @java Is.construct(IsPuzzleGraphType, SiteType)
   * @example (is Unique)
   */
  public static constructGraph(
    isType: IsPuzzleGraphType,
    elementType: SiteType | null = null,
  ): BaseBooleanFunction {
    switch (isType) {
      case IsPuzzleGraphType.Unique:
        return new IsUnique(elementType);
      default:
        throw new Error("Is(): A IsPuzzleGraphType is not implemented.");
    }
  }

  /**
   * For a constraint related to count or sum.
   * @java Is.construct(IsPuzzleRegionResultType, SiteType, RegionFunction, IntFunction, String, IntFunction)
   * @example (is Count (sites All) of:1 8)
   * @example (is Sum 5)
   */
  public static constructRegionResult(
    isType: IsPuzzleRegionResultType,
    type: SiteType | null = null,
    region: RegionFunction | null = null,
    of: IntFunction | null = null,
    nameRegion: string | null = null,
    result: IntFunction,
  ): BaseBooleanFunction {
    switch (isType) {
      case IsPuzzleRegionResultType.Count:
        return new IsCount(type, region, of, result);
      case IsPuzzleRegionResultType.Sum:
        return new IsSum(type, region, nameRegion, result);
      default:
        throw new Error("Is(): A IsPuzzleRegionResultType is not implemented.");
    }
  }

  // ---- BaseBooleanFunction stubs -----------------------------------------

  /** @java Is.isStatic() — should never be called */
  public override isStatic(): boolean {
    return false;
  }

  /** @java Is.gameFlags(Game) — should never be called */
  public override gameFlags(_game: unknown): number {
    return 0;
  }

  /** @java Is.preprocess(Game) — nothing to do */
  public override preprocess(_game: unknown): void {
    // Nothing to do.
  }

  /**
   * @java Is.eval(Context) — should never be called directly.
   */
  public override eval(_context: Context): boolean {
    throw new Error(
      "Is.eval(): Should never be called directly.",
    );
  }
}

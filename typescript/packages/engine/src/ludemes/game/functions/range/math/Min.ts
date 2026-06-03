// @java Core/src/game/functions/range/math/Min.java

import type { Context } from "../../../../../context.js";
import type { IntFunction } from "../../../../base.js";
import { IntConstant } from "../../ints/IntConstant.js";
import { Range } from "../Range.js";

/** Java Constants.INFINITY = 1_000_000_000 */
const INFINITY = 1_000_000_000;

/**
 * Returns a range with a specified minimum (inclusive) and unbounded maximum.
 *
 * Java parity: final class extending BaseRangeFunction.
 * super(min, new IntConstant(Constants.INFINITY))
 * eval() returns a new Range(IntConstant(minVal), IntConstant(INFINITY)).
 *
 * @java game.functions.range.math.Min
 * @author cambolbro and Eric.Piette
 */
export class Min extends Range {
  /**
   * @java Min(IntFunction min)
   * max is set to Constants.INFINITY (1_000_000_000).
   */
  public constructor(min: IntFunction) {
    super(min, new IntConstant(INFINITY));
  }

  /**
   * @java Min.eval(Context) — returns a Range(minVal, INFINITY) or precomputed.
   */
  public override eval(ctx: Context): Range {
    if (this.precomputedRange !== null) return this.precomputedRange;
    const minVal = this.minFn.eval(ctx);
    const maxVal = this.maxFn.eval(ctx);
    return new Range(new IntConstant(minVal), new IntConstant(maxVal));
  }

  /** @java Min.preprocess(Game) */
  public override preprocess(game: unknown): void {
    (this.minFn as { preprocess?(g: unknown): void }).preprocess?.(game);
    (this.maxFn as { preprocess?(g: unknown): void }).preprocess?.(game);
    if (this.isStatic()) {
      this.precomputedRange = this.eval(null as unknown as Context);
    }
  }
}

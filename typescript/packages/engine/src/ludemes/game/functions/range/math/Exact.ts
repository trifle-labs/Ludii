// @java Core/src/game/functions/range/math/Exact.java

import type { Context } from "../../../../../context.js";
import type { IntFunction } from "../../../../base.js";
import { IntConstant } from "../../ints/IntConstant.js";
import { Range } from "../Range.js";

/**
 * Returns a range of exactly one value (min == max == value).
 *
 * Java parity: final class extending BaseRangeFunction. super(value, value).
 * eval() returns a new Range(IntConstant(val), IntConstant(val)), or
 * the precomputed range if available.
 *
 * @java game.functions.range.math.Exact
 * @author Eric.Piette and cambolbro
 */
export class Exact extends Range {
  /**
   * @java Exact(IntFunction value)
   * The exact value is both the minimum and maximum.
   */
  public constructor(value: IntFunction) {
    super(value, value);
  }

  /**
   * @java Exact.eval(Context) — returns a Range(val, val) or precomputed.
   */
  public override eval(ctx: Context): Range {
    if (this.precomputedRange !== null) return this.precomputedRange;
    const val = this.minFn.eval(ctx);
    return new Range(new IntConstant(val), new IntConstant(val));
  }

  /** @java Exact.preprocess(Game) */
  public override preprocess(game: unknown): void {
    (this.minFn as { preprocess?(g: unknown): void }).preprocess?.(game);
    (this.maxFn as { preprocess?(g: unknown): void }).preprocess?.(game);
    if (this.isStatic()) {
      this.precomputedRange = this.eval(null as unknown as Context);
    }
  }
}

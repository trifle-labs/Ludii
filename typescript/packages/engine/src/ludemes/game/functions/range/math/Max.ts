// @java Core/src/game/functions/range/math/Max.java

import type { Context } from "../../../../../context.js";
import type { IntFunction } from "../../../../base.js";
import { IntConstant } from "../../ints/IntConstant.js";
import { Range } from "../Range.js";

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Returns a range with a specified maximum (inclusive) and undefined minimum.
 *
 * Java parity: final class extending BaseRangeFunction.
 * super(new IntConstant(Constants.UNDEFINED), max)
 * eval() returns a new Range(IntConstant(UNDEFINED), IntConstant(maxVal)).
 *
 * @java game.functions.range.math.Max
 * @author cambolbro and Eric.Piette
 */
export class Max extends Range {
  /**
   * @java Max(IntFunction max)
   * min is set to Constants.UNDEFINED (-1).
   */
  public constructor(max: IntFunction) {
    super(new IntConstant(UNDEFINED), max);
  }

  /**
   * @java Max.eval(Context) — returns a Range(UNDEFINED, maxVal) or precomputed.
   */
  public override eval(ctx: Context): Range {
    if (this.precomputedRange !== null) return this.precomputedRange;
    const minVal = this.minFn.eval(ctx);
    const maxVal = this.maxFn.eval(ctx);
    return new Range(new IntConstant(minVal), new IntConstant(maxVal));
  }

  /** @java Max.preprocess(Game) */
  public override preprocess(game: unknown): void {
    (this.minFn as { preprocess?(g: unknown): void }).preprocess?.(game);
    (this.maxFn as { preprocess?(g: unknown): void }).preprocess?.(game);
    if (this.isStatic()) {
      this.precomputedRange = this.eval(null as unknown as Context);
    }
  }
}

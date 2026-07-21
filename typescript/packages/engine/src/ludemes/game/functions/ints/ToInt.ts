// @java Core/src/game/functions/ints/ToInt.java

/**
 * Converts a BooleanFunction or a FloatFunction to an integer.
 *
 * @java game/functions/ints/ToInt.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../context.js";
import type { BooleanFunction, FloatFunction } from "../../../base.js";
import { BaseIntFunction } from "./BaseIntFunction.js";

/**
 * Converts a BooleanFunction (→ 0 or 1) or a FloatFunction (→ truncated int)
 * to an integer.
 *
 * @java game/functions/ints/ToInt.java
 */
export class ToInt extends BaseIntFunction {
  /** @java ToInt.boolFn */
  private readonly boolFn: BooleanFunction | null;

  /** @java ToInt.floatFn */
  private readonly floatFn: FloatFunction | null;

  /**
   * @param boolFn  The boolean function (XOR floatFn must be non-null).
   * @param floatFn The float function   (XOR boolFn must be non-null).
   *
   * @java ToInt(BooleanFunction, FloatFunction) — exactly one must be non-null.
   */
  public constructor(
    boolFn: BooleanFunction | null,
    floatFn: FloatFunction | null,
  ) {
    super();
    const numNonNull = (boolFn !== null ? 1 : 0) + (floatFn !== null ? 1 : 0);
    if (numNonNull !== 1) {
      throw new Error(
        "ToInt(): One boolFn or floatFn parameter must be non-null.",
      );
    }
    this.boolFn = boolFn;
    this.floatFn = floatFn;
  }

  /**
   * @java ToInt.eval(Context)
   * Returns 1/0 when wrapping a BooleanFunction, or the truncated float value.
   */
  public override eval(context: Context): number {
    if (this.boolFn !== null) {
      return this.boolFn.eval(context as never) ? 1 : 0;
    }
    // floatFn is non-null (enforced by constructor)
    return Math.trunc((this.floatFn as FloatFunction).eval(context as never));
  }

  /** @java ToInt.isStatic() */
  public isStatic(): boolean {
    if (this.boolFn !== null) return (this.boolFn as unknown as { isStatic(): boolean }).isStatic?.() ?? false;
    if (this.floatFn !== null) return (this.floatFn as unknown as { isStatic(): boolean }).isStatic?.() ?? false;
    return false;
  }

  /** @java ToInt.gameFlags(Game) */
  public override concepts(_game: unknown): Set<number> {
    const concepts = new Set<number>();
    // boolFn / floatFn concepts would be merged here when the dependency tree is wired
    return concepts;
  }

  /** @java ToInt.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    return new Set();
  }

  /** @java ToInt.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    return new Set();
  }

  /** @java ToInt.missingRequirement(Game) */
  public override missingRequirement(_game: unknown): boolean {
    return false;
  }

  /** @java ToInt.willCrash(Game) */
  public override willCrash(_game: unknown): boolean {
    return false;
  }
}

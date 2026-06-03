// @java Core/src/game/functions/booleans/ToBool.java

/**
 * Converts an IntFunction or FloatFunction to a boolean
 * (false if 0 / 0.0, true otherwise).
 *
 * @java game.functions.booleans.ToBool
 */

import type { Context } from "../../../../context.js";
import type { IntFunction, FloatFunction } from "../../../base.js";
import { BaseBooleanFunction } from "./BaseBooleanFunction.js";

/**
 * @java game.functions.booleans.ToBool
 */
export class ToBool extends BaseBooleanFunction {
  /** @java ToBool.intFn */
  private readonly intFn: IntFunction | null;
  /** @java ToBool.floatFn */
  private readonly floatFn: FloatFunction | null;

  /**
   * Exactly one of `intFn` or `floatFn` must be non-null.
   * @java ToBool(IntFunction, FloatFunction)
   */
  public constructor(
    intFn: IntFunction | null,
    floatFn: FloatFunction | null,
  ) {
    super();
    let numNonNull = 0;
    if (intFn != null) numNonNull++;
    if (floatFn != null) numNonNull++;
    if (numNonNull !== 1) {
      throw new Error(
        "ToBool(): One intFn or floatFn parameter must be non-null.",
      );
    }
    this.intFn = intFn;
    this.floatFn = floatFn;
  }

  /**
   * @java ToBool.eval(Context)
   *   if (intFn != null) return intFn.eval(context) != 0;
   *   return floatFn.eval(context) != 0.0;
   */
  public override eval(context: Context): boolean {
    if (this.intFn != null) {
      return this.intFn.eval(context) !== 0;
    }
    return (this.floatFn as FloatFunction).eval(context) !== 0.0;
  }

  /** @java ToBool.isStatic() */
  public override isStatic(): boolean {
    if (this.intFn != null) return (this.intFn as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
    if (this.floatFn != null) return (this.floatFn as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
    return false;
  }

  /** @java ToBool.gameFlags(Game) */
  public override gameFlags(game: unknown): number {
    let flags = 0;
    if (this.intFn != null) flags |= (this.intFn as unknown as { gameFlags(g: unknown): number }).gameFlags?.(game) ?? 0;
    if (this.floatFn != null) flags |= (this.floatFn as unknown as { gameFlags(g: unknown): number }).gameFlags?.(game) ?? 0;
    return flags;
  }

  /** @java ToBool.preprocess(Game) */
  public override preprocess(game: unknown): void {
    (this.intFn as unknown as { preprocess?(g: unknown): void })?.preprocess?.(game);
    (this.floatFn as unknown as { preprocess?(g: unknown): void })?.preprocess?.(game);
  }

  /** @java ToBool.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missing = false;
    if (this.intFn != null) missing ||= (this.intFn as unknown as { missingRequirement(g: unknown): boolean }).missingRequirement?.(game) ?? false;
    if (this.floatFn != null) missing ||= (this.floatFn as unknown as { missingRequirement(g: unknown): boolean }).missingRequirement?.(game) ?? false;
    return missing;
  }

  /** @java ToBool.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let crash = false;
    if (this.intFn != null) crash ||= (this.intFn as unknown as { willCrash(g: unknown): boolean }).willCrash?.(game) ?? false;
    if (this.floatFn != null) crash ||= (this.floatFn as unknown as { willCrash(g: unknown): boolean }).willCrash?.(game) ?? false;
    return crash;
  }
}

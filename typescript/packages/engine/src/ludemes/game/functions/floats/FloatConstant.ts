// @java Core/src/game/functions/floats/FloatConstant.java

import type { Context } from "../../../../context.js";
import { BaseFloatFunction } from "./BaseFloatFunction.js";

/**
 * Sets a constant float value.
 *
 * Java parity: @Hide final class extending BaseFloatFunction.
 * eval(context) always returns the stored constant.
 *
 * @java game.functions.floats.FloatConstant
 * @author cambolbro
 */
export class FloatConstant extends BaseFloatFunction {
  /** Constant value. @java FloatConstant.a */
  private readonly a: number;

  /**
   * @java FloatConstant(float a)
   * @param a The constant float value.
   */
  public constructor(a: number) {
    super();
    this.a = a;
  }

  /** @java FloatConstant.eval(Context) — returns the constant */
  public eval(_ctx: Context): number {
    return this.a;
  }

  /** @java FloatConstant.isStatic() — always true */
  public override isStatic(): boolean {
    return true;
  }

  /** @java FloatConstant.gameFlags(Game) — 0 */
  public override gameFlags(_game: unknown): number {
    return 0;
  }

  /** @java FloatConstant.preprocess(Game) — nothing to do */
  public override preprocess(_game: unknown): void {
    // nothing to do
  }

  /** @java FloatConstant.toString() */
  public override toString(): string {
    return String(this.a);
  }
}

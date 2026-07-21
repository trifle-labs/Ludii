// @java Core/src/game/functions/directions/If.java

import type { Context } from "../../../../context.js";
import type { BooleanFunction, DirectionsFunction } from "../../../base.js";

/**
 * Returns one of two direction sets depending on a boolean condition.
 *
 * Java parity: If extends DirectionsFunction. It holds a condition
 * (BooleanFunction) and two DirectionsFunction branches.
 * convertToAbsolute delegates to whichever branch the condition selects.
 *
 * @java game.functions.directions.If
 * @author Eric.Piette
 */
export class If implements DirectionsFunction {
  /** Direction function when the condition is true. @java If.directionFunctionOk */
  private readonly directionFunctionOk: DirectionsFunction;

  /** Direction function when the condition is false. @java If.directionFunctionNotOk */
  private readonly directionFunctionNotOk: DirectionsFunction;

  /** The condition. @java If.condition */
  private readonly condition: BooleanFunction;

  /**
   * @java If(BooleanFunction condition, Direction directionsOk, Direction directionsNotOk)
   */
  public constructor(
    condition: BooleanFunction,
    directionFunctionOk: DirectionsFunction,
    directionFunctionNotOk: DirectionsFunction,
  ) {
    // The compiler hands these slots raw direction tokens (Janggi:
    // `(if (...) Forward (directions {...}))` binds the bare ident) — wrap
    // strings/arrays so eval() works. @java Directions(AbsoluteDirection)
    const wrapD = (d: DirectionsFunction | string | readonly string[]): DirectionsFunction => {
      if (typeof d === "string") return { eval: () => [d] } as DirectionsFunction;
      if (Array.isArray(d)) return { eval: () => [...d] } as DirectionsFunction;
      return d as DirectionsFunction;
    };
    this.condition = condition;
    this.directionFunctionOk = wrapD(directionFunctionOk);
    this.directionFunctionNotOk = wrapD(directionFunctionNotOk);
  }

  /**
   * Returns the selected direction set based on condition.
   * @java If.convertToAbsolute — delegates to the true or false branch.
   */
  public eval(ctx: Context): string[] {
    if (this.condition.eval(ctx)) {
      return this.directionFunctionOk.eval(ctx);
    }
    return this.directionFunctionNotOk.eval(ctx);
  }

  /** @java If.isStatic */
  public isStatic(): boolean {
    return false;
  }

  /** @java If.toString */
  public toString(): string {
    return "";
  }
}

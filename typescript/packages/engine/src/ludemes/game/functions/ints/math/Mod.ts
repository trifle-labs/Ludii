// @java Core/src/game/functions/ints/math/Mod.java

/**
 * Returns the value modulo the modulus.
 *
 * @java game/functions/ints/math/Mod.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";

export class Mod extends BaseIntFunction {
  /** @java Mod.value */
  private readonly value: JavaIntFunction;
  /** @java Mod.modulus */
  private readonly modulus: JavaIntFunction;

  /** @java Mod(IntFunction value, IntFunction modulo) */
  public constructor(value: JavaIntFunction, modulo: JavaIntFunction) {
    super();
    this.value = value;
    this.modulus = modulo;
  }

  /** @java Mod.eval(Context) — value.eval % modulus.eval */
  public override eval(context: Context): number {
    return this.value.eval(context) % this.modulus.eval(context);
  }

  /** @java Mod.isStatic() */
  public isStatic(): boolean { return false; }
}

/**
 * Math1to1.ts
 *
 * Faithful 1:1 ports of the math int ludemes:
 *   Add, Sub, Mul, Div, Mod, Abs, Pow, Max, Min, If(int)
 *
 * @java game/functions/ints/math/Add.java
 * @java game/functions/ints/math/Sub.java
 * @java game/functions/ints/math/Mul.java
 * @java game/functions/ints/math/Div.java
 * @java game/functions/ints/math/Mod.java
 * @java game/functions/ints/math/Abs.java
 * @java game/functions/ints/math/Pow.java
 * @java game/functions/ints/math/Max.java
 * @java game/functions/ints/math/Min.java
 * @java game/functions/ints/math/If.java
 */

import type { Context } from "../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import { isList } from "@ludii/typescript-language";

function isIntFunction(value: unknown): value is IntFunction {
  return value !== null && typeof value === "object" && typeof (value as { eval?: unknown }).eval === "function";
}

// ---------------------------------------------------------------------------
// Add  (alias "+")
// ---------------------------------------------------------------------------
export class Add implements IntFunction {
  private readonly fns: readonly IntFunction[] | null;
  private readonly arrayFn: { eval(ctx: Context): readonly number[] } | null;

  public constructor(
    fns: readonly IntFunction[] | IntFunction | null,
    bOrArray: IntFunction | { eval(ctx: Context): readonly number[] } | null = null,
  ) {
    if (Array.isArray(fns)) {
      this.fns = fns as readonly IntFunction[];
      this.arrayFn = null;
    } else if (fns !== null) {
      this.fns = bOrArray !== null && isIntFunction(bOrArray) ? [fns as IntFunction, bOrArray] : [fns as IntFunction];
      this.arrayFn = null;
    } else {
      this.fns = null;
      this.arrayFn = bOrArray as { eval(ctx: Context): readonly number[] } | null;
    }
  }

  /** @java game/functions/ints/math/Add.java — eval: sum of all IntArrayFunction values */
  public eval(ctx: Context): number {
    let sum = 0;
    if (this.fns !== null) {
      for (const f of this.fns) sum += f.eval(ctx);
    } else {
      for (const value of this.arrayFn?.eval(ctx) ?? []) sum += value;
    }
    return sum;
  }
}

// ---------------------------------------------------------------------------
// Pow
// ---------------------------------------------------------------------------
export class Pow implements IntFunction {
  private readonly base: IntFunction;
  private readonly exp: IntFunction;

  public constructor(base: IntFunction, exp: IntFunction) {
    this.base = base;
    this.exp = exp;
  }

  /** @java game/functions/ints/math/Pow.java — eval: Math.trunc(Math.pow(base, exp)) */
  public eval(ctx: Context): number {
    return Math.trunc(Math.pow(this.base.eval(ctx), this.exp.eval(ctx)));
  }
}

// ---------------------------------------------------------------------------
// If (int)
// ---------------------------------------------------------------------------
export class IfInt implements IntFunction {
  private readonly cond: BooleanFunction;
  private readonly then: IntFunction;
  private readonly else_: IntFunction;

  public constructor(cond: BooleanFunction, then: IntFunction, else_: IntFunction) {
    this.cond = cond;
    this.then = then;
    this.else_ = else_;
  }

  /** @java game/functions/ints/math/If.java — eval: cond ? then : else */
  public eval(ctx: Context): number {
    return this.cond.eval(ctx) ? this.then.eval(ctx) : this.else_.eval(ctx);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------


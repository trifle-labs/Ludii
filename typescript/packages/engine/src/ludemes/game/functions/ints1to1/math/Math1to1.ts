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
export class Add1to1 implements IntFunction {
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
// Sub  (alias "-")
// ---------------------------------------------------------------------------
export class Sub1to1 implements IntFunction {
  private readonly a: IntFunction;
  private readonly b: IntFunction;

  public constructor(a: IntFunction, b: IntFunction) {
    this.a = a;
    this.b = b;
  }

  /** @java game/functions/ints/math/Sub.java — eval: valueA - valueB */
  public eval(ctx: Context): number {
    return this.a.eval(ctx) - this.b.eval(ctx);
  }
}

// ---------------------------------------------------------------------------
// Mul  (alias "*")
// ---------------------------------------------------------------------------
export class Mul1to1 implements IntFunction {
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

  /** @java game/functions/ints/math/Mul.java — eval: product */
  public eval(ctx: Context): number {
    let prod = 1;
    if (this.fns !== null) {
      for (const f of this.fns) prod *= f.eval(ctx);
    } else {
      for (const value of this.arrayFn?.eval(ctx) ?? []) prod *= value;
    }
    return prod;
  }
}

// ---------------------------------------------------------------------------
// Div  (alias "/")
// ---------------------------------------------------------------------------
export class Div1to1 implements IntFunction {
  private readonly a: IntFunction;
  private readonly b: IntFunction;

  public constructor(a: IntFunction, b: IntFunction) {
    this.a = a;
    this.b = b;
  }

  /** @java game/functions/ints/math/Div.java — eval: Math.trunc(a/b), returns 0 if b==0 */
  public eval(ctx: Context): number {
    const bv = this.b.eval(ctx);
    if (bv === 0) return 0;
    return Math.trunc(this.a.eval(ctx) / bv);
  }
}

// ---------------------------------------------------------------------------
// Abs
// ---------------------------------------------------------------------------
export class Abs1to1 implements IntFunction {
  private readonly fn: IntFunction;

  public constructor(fn: IntFunction) {
    this.fn = fn;
  }

  /** @java game/functions/ints/math/Abs.java — eval: Math.abs(fn) */
  public eval(ctx: Context): number {
    return Math.abs(this.fn.eval(ctx));
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
// Max
// ---------------------------------------------------------------------------
export class Max1to1 implements IntFunction {
  private readonly fns: readonly IntFunction[];

  public constructor(fns: readonly IntFunction[]) {
    this.fns = fns;
  }

  /** @java game/functions/ints/math/Max.java — eval: max of sub-functions */
  public eval(ctx: Context): number {
    if (this.fns.length === 0) return 0;
    let m = this.fns[0]!.eval(ctx);
    for (let i = 1; i < this.fns.length; i++) {
      const v = this.fns[i]!.eval(ctx);
      if (v > m) m = v;
    }
    return m;
  }
}

// ---------------------------------------------------------------------------
// Min
// ---------------------------------------------------------------------------
export class Min1to1 implements IntFunction {
  private readonly fns: readonly IntFunction[];

  public constructor(fns: readonly IntFunction[]) {
    this.fns = fns;
  }

  /** @java game/functions/ints/math/Min.java — eval: min of sub-functions */
  public eval(ctx: Context): number {
    if (this.fns.length === 0) return 0;
    let m = this.fns[0]!.eval(ctx);
    for (let i = 1; i < this.fns.length; i++) {
      const v = this.fns[i]!.eval(ctx);
      if (v < m) m = v;
    }
    return m;
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


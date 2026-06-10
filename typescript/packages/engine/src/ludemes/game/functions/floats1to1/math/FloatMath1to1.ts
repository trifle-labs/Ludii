/**
 * FloatMath1to1.ts
 *
 * Faithful 1:1 ports of the float math ludemes:
 *   Add(+), Sub(-), Mul(*), Div(/), Pow(^), Sqrt, Abs,
 *   Cos, Sin, Tan, Exp, Log, Log10, Min, Max
 *
 * @java game/functions/floats/math/Add.java
 * @java game/functions/floats/math/Sub.java
 * @java game/functions/floats/math/Mul.java
 * @java game/functions/floats/math/Div.java
 * @java game/functions/floats/math/Pow.java
 * @java game/functions/floats/math/Sqrt.java
 * @java game/functions/floats/math/Abs.java
 * @java game/functions/floats/math/Cos.java
 * @java game/functions/floats/math/Sin.java
 * @java game/functions/floats/math/Tan.java
 * @java game/functions/floats/math/Exp.java
 * @java game/functions/floats/math/Log.java
 * @java game/functions/floats/math/Log10.java
 * @java game/functions/floats/math/Min.java
 * @java game/functions/floats/math/Max.java
 */

import type { Context } from "../../../../../context.js";
import type { FloatFunction } from "../../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";
import { isList } from "@ludii/typescript-language";
import { registerFloat1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import { parseArgs1to1, compileFloat1to1 } from "../../../../../compiler1to1.js";

// ---------------------------------------------------------------------------
// Helper — collect FloatFunction[] from positional args (handles curly-list)
// ---------------------------------------------------------------------------
function collectFloatFns(node: LudNode, _env: Compile1to1Env): FloatFunction[] {
  const { positional } = parseArgs1to1((node as LudList).items);
  const fns: FloatFunction[] = [];
  for (const p of positional) {
    if (isList(p) && (p as LudList).delimiter === "curly") {
      for (const child of (p as LudList).items) {
        try { fns.push(compileFloat1to1(child)); } catch { /* skip */ }
      }
    } else {
      try { fns.push(compileFloat1to1(p)); } catch { /* skip */ }
    }
  }
  return fns;
}

// ---------------------------------------------------------------------------
// Add  (alias "+")
// @java game/functions/floats/math/Add.java
// ---------------------------------------------------------------------------
export class FloatAdd1to1 implements FloatFunction {
  private readonly a: FloatFunction | null;
  private readonly b: FloatFunction | null;
  private readonly list: readonly FloatFunction[] | null;

  public constructor(a: FloatFunction, b: FloatFunction);
  public constructor(list: readonly FloatFunction[]);
  public constructor(
    aOrList: FloatFunction | readonly FloatFunction[],
    ...rest: [] | [b: FloatFunction]
  ) {
    if (Array.isArray(aOrList)) {
      this.a = null;
      this.b = null;
      this.list = aOrList as readonly FloatFunction[];
    } else {
      this.a = aOrList as FloatFunction;
      this.b = rest[0]!;
      this.list = null;
    }
  }

  /** @java game/functions/floats/math/Add.java — eval(Context) */
  public eval(ctx: Context): number {
    if (this.list === null) {
      return this.a!.eval(ctx) + this.b!.eval(ctx);
    }
    let sum = 0;
    for (const elem of this.list) sum += elem.eval(ctx);
    return sum;
  }
}

// ---------------------------------------------------------------------------
// Sub  (alias "-")
// @java game/functions/floats/math/Sub.java
// ---------------------------------------------------------------------------
export class FloatSub1to1 implements FloatFunction {
  private readonly valueA: FloatFunction;
  private readonly valueB: FloatFunction;

  public constructor(valueA: FloatFunction, valueB: FloatFunction) {
    this.valueA = valueA;
    this.valueB = valueB;
  }

  /** @java game/functions/floats/math/Sub.java — eval: valueA - valueB */
  public eval(ctx: Context): number {
    return this.valueA.eval(ctx) - this.valueB.eval(ctx);
  }
}

// ---------------------------------------------------------------------------
// Mul  (alias "*")
// @java game/functions/floats/math/Mul.java
// ---------------------------------------------------------------------------
export class FloatMul1to1 implements FloatFunction {
  private readonly a: FloatFunction | null;
  private readonly b: FloatFunction | null;
  private readonly list: readonly FloatFunction[] | null;

  public constructor(a: FloatFunction, b: FloatFunction);
  public constructor(list: readonly FloatFunction[]);
  public constructor(
    aOrList: FloatFunction | readonly FloatFunction[],
    b?: FloatFunction,
  ) {
    if (Array.isArray(aOrList)) {
      this.a = null;
      this.b = null;
      this.list = aOrList as readonly FloatFunction[];
    } else {
      this.a = aOrList as FloatFunction;
      this.b = b!;
      this.list = null;
    }
  }

  /** @java game/functions/floats/math/Mul.java — eval: a*b or list product */
  public eval(ctx: Context): number {
    if (this.list === null) {
      return this.a!.eval(ctx) * this.b!.eval(ctx);
    }
    let product = 1;
    for (const elem of this.list) product *= elem.eval(ctx);
    return product;
  }
}

// ---------------------------------------------------------------------------
// Div  (alias "/")
// @java game/functions/floats/math/Div.java
// ---------------------------------------------------------------------------
export class FloatDiv1to1 implements FloatFunction {
  private readonly a: FloatFunction;
  private readonly b: FloatFunction;

  public constructor(a: FloatFunction, b: FloatFunction) {
    this.a = a;
    this.b = b;
  }

  /** @java game/functions/floats/math/Div.java — eval: throws on zero divisor */
  public eval(ctx: Context): number {
    const evalB = this.b.eval(ctx);
    if (evalB === 0) throw new Error("Division by zero.");
    return this.a.eval(ctx) / evalB;
  }
}

// ---------------------------------------------------------------------------
// Pow  (alias "^")
// @java game/functions/floats/math/Pow.java
// ---------------------------------------------------------------------------
export class FloatPow1to1 implements FloatFunction {
  private readonly a: FloatFunction;
  private readonly b: FloatFunction;

  public constructor(a: FloatFunction, b: FloatFunction) {
    this.a = a;
    this.b = b;
  }

  /** @java game/functions/floats/math/Pow.java — eval: (float) Math.pow(a, b) */
  public eval(ctx: Context): number {
    return Math.pow(this.a.eval(ctx), this.b.eval(ctx));
  }
}

// ---------------------------------------------------------------------------
// Sqrt
// @java game/functions/floats/math/Sqrt.java
// ---------------------------------------------------------------------------
export class FloatSqrt1to1 implements FloatFunction {
  private readonly a: FloatFunction;

  public constructor(a: FloatFunction) {
    this.a = a;
  }

  /** @java game/functions/floats/math/Sqrt.java — eval: throws on negative */
  public eval(ctx: Context): number {
    const value = this.a.eval(ctx);
    if (value < 0) throw new Error("Sqrt of a negative value is undefined.");
    return Math.sqrt(value);
  }
}

// ---------------------------------------------------------------------------
// Abs
// @java game/functions/floats/math/Abs.java
// ---------------------------------------------------------------------------
export class FloatAbs1to1 implements FloatFunction {
  private readonly value: FloatFunction;

  public constructor(value: FloatFunction) {
    this.value = value;
  }

  /** @java game/functions/floats/math/Abs.java — eval: Math.abs(value) */
  public eval(ctx: Context): number {
    return Math.abs(this.value.eval(ctx));
  }
}

// ---------------------------------------------------------------------------
// Cos
// @java game/functions/floats/math/Cos.java
// ---------------------------------------------------------------------------
export class FloatCos1to1 implements FloatFunction {
  private readonly a: FloatFunction;

  public constructor(a: FloatFunction) {
    this.a = a;
  }

  /** @java game/functions/floats/math/Cos.java — eval: (float) Math.cos(a) */
  public eval(ctx: Context): number {
    return Math.cos(this.a.eval(ctx));
  }
}

// ---------------------------------------------------------------------------
// Sin
// @java game/functions/floats/math/Sin.java
// ---------------------------------------------------------------------------
export class FloatSin1to1 implements FloatFunction {
  private readonly a: FloatFunction;

  public constructor(a: FloatFunction) {
    this.a = a;
  }

  /** @java game/functions/floats/math/Sin.java — eval: (float) Math.sin(a) */
  public eval(ctx: Context): number {
    return Math.sin(this.a.eval(ctx));
  }
}

// ---------------------------------------------------------------------------
// Tan
// @java game/functions/floats/math/Tan.java
// ---------------------------------------------------------------------------
export class FloatTan1to1 implements FloatFunction {
  private readonly a: FloatFunction;

  public constructor(a: FloatFunction) {
    this.a = a;
  }

  /** @java game/functions/floats/math/Tan.java — eval: (float) Math.tan(a) */
  public eval(ctx: Context): number {
    return Math.tan(this.a.eval(ctx));
  }
}

// ---------------------------------------------------------------------------
// Exp
// @java game/functions/floats/math/Exp.java
// ---------------------------------------------------------------------------
export class FloatExp1to1 implements FloatFunction {
  private readonly a: FloatFunction;

  public constructor(a: FloatFunction) {
    this.a = a;
  }

  /** @java game/functions/floats/math/Exp.java — eval: (float) Math.exp(a) */
  public eval(ctx: Context): number {
    return Math.exp(this.a.eval(ctx));
  }
}

// ---------------------------------------------------------------------------
// Log  (natural log)
// @java game/functions/floats/math/Log.java
// ---------------------------------------------------------------------------
export class FloatLog1to1 implements FloatFunction {
  private readonly a: FloatFunction;

  public constructor(a: FloatFunction) {
    this.a = a;
  }

  /** @java game/functions/floats/math/Log.java — eval: throws on zero */
  public eval(ctx: Context): number {
    const value = this.a.eval(ctx);
    if (value === 0) throw new Error("Logarithm of zero is undefined.");
    return Math.log(value);
  }
}

// ---------------------------------------------------------------------------
// Log10
// @java game/functions/floats/math/Log10.java
// ---------------------------------------------------------------------------
export class FloatLog10_1to1 implements FloatFunction {
  private readonly a: FloatFunction;

  public constructor(a: FloatFunction) {
    this.a = a;
  }

  /** @java game/functions/floats/math/Log10.java — eval: throws on zero */
  public eval(ctx: Context): number {
    const value = this.a.eval(ctx);
    if (value === 0) throw new Error("Logarithm 10 of zero is undefined.");
    return Math.log10(value);
  }
}

// ---------------------------------------------------------------------------
// Min
// @java game/functions/floats/math/Min.java
// ---------------------------------------------------------------------------
export class FloatMin1to1 implements FloatFunction {
  private readonly a: FloatFunction | null;
  private readonly b: FloatFunction | null;
  private readonly list: readonly FloatFunction[] | null;

  public constructor(a: FloatFunction, b: FloatFunction);
  public constructor(list: readonly FloatFunction[]);
  public constructor(
    aOrList: FloatFunction | readonly FloatFunction[],
    b?: FloatFunction,
  ) {
    if (Array.isArray(aOrList)) {
      this.a = null;
      this.b = null;
      this.list = aOrList as readonly FloatFunction[];
    } else {
      this.a = aOrList as FloatFunction;
      this.b = b!;
      this.list = null;
    }
  }

  /** @java game/functions/floats/math/Min.java — eval: Math.min(a,b) or fold list */
  public eval(ctx: Context): number {
    if (this.list === null) {
      return Math.min(this.a!.eval(ctx), this.b!.eval(ctx));
    }
    let min = this.list[0]!.eval(ctx);
    for (let i = 1; i < this.list.length; i++) {
      min = Math.min(min, this.list[i]!.eval(ctx));
    }
    return min;
  }
}

// ---------------------------------------------------------------------------
// Max
// @java game/functions/floats/math/Max.java
// ---------------------------------------------------------------------------
export class FloatMax1to1 implements FloatFunction {
  private readonly a: FloatFunction | null;
  private readonly b: FloatFunction | null;
  private readonly list: readonly FloatFunction[] | null;

  public constructor(a: FloatFunction, b: FloatFunction);
  public constructor(list: readonly FloatFunction[]);
  public constructor(
    aOrList: FloatFunction | readonly FloatFunction[],
    b?: FloatFunction,
  ) {
    if (Array.isArray(aOrList)) {
      this.a = null;
      this.b = null;
      this.list = aOrList as readonly FloatFunction[];
    } else {
      this.a = aOrList as FloatFunction;
      this.b = b!;
      this.list = null;
    }
  }

  /** @java game/functions/floats/math/Max.java — eval: Math.max(a,b) or fold list */
  public eval(ctx: Context): number {
    if (this.list === null) {
      return Math.max(this.a!.eval(ctx), this.b!.eval(ctx));
    }
    let max = this.list[0]!.eval(ctx);
    for (let i = 1; i < this.list.length; i++) {
      max = Math.max(max, this.list[i]!.eval(ctx));
    }
    return max;
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

// Add  (+ / add)
function registerFloatAdd() {
  const factory = (node: LudNode, env: Compile1to1Env): FloatFunction => {
    const fns = collectFloatFns(node, env);
    if (fns.length === 2) return new FloatAdd1to1(fns[0]!, fns[1]!);
    return new FloatAdd1to1(fns);
  };
}
registerFloatAdd();

// Sub  (- / sub)
function registerFloatSub() {
  const factory = (node: LudNode, env: Compile1to1Env): FloatFunction => {
    const fns = collectFloatFns(node, env);
    if (fns.length === 0) return { eval: (_ctx: Context) => 0 };
    if (fns.length === 1) { const f = fns[0]!; return { eval: (ctx: Context) => -f.eval(ctx) }; }
    return new FloatSub1to1(fns[0]!, fns[1]!);
  };
}
registerFloatSub();

// Mul  (* / mul)
function registerFloatMul() {
  const factory = (node: LudNode, env: Compile1to1Env): FloatFunction => {
    const fns = collectFloatFns(node, env);
    if (fns.length === 2) return new FloatMul1to1(fns[0]!, fns[1]!);
    return new FloatMul1to1(fns);
  };
}
registerFloatMul();

// Div  (/ / div)
function registerFloatDiv() {
  const factory = (node: LudNode, env: Compile1to1Env): FloatFunction => {
    const fns = collectFloatFns(node, env);
    if (fns.length < 2) return fns[0] ?? { eval: (_ctx: Context) => 0 };
    return new FloatDiv1to1(fns[0]!, fns[1]!);
  };
}
registerFloatDiv();

// Pow  (^ / pow)
function registerFloatPow() {
  const factory = (node: LudNode, env: Compile1to1Env): FloatFunction => {
    const fns = collectFloatFns(node, env);
    if (fns.length < 2) return fns[0] ?? { eval: (_ctx: Context) => 0 };
    return new FloatPow1to1(fns[0]!, fns[1]!);
  };
}
registerFloatPow();

// Sqrt
// Abs
// Cos
// Sin
// Tan
// Exp
// Log (natural)
// Log10
// Min
function registerFloatMin() {
  const factory = (node: LudNode, env: Compile1to1Env): FloatFunction => {
    const fns = collectFloatFns(node, env);
    if (fns.length === 0) return { eval: (_ctx: Context) => 0 };
    if (fns.length === 2) return new FloatMin1to1(fns[0]!, fns[1]!);
    return new FloatMin1to1(fns);
  };
}
registerFloatMin();

// Max
function registerFloatMax() {
  const factory = (node: LudNode, env: Compile1to1Env): FloatFunction => {
    const fns = collectFloatFns(node, env);
    if (fns.length === 0) return { eval: (_ctx: Context) => 0 };
    if (fns.length === 2) return new FloatMax1to1(fns[0]!, fns[1]!);
    return new FloatMax1to1(fns);
  };
}
registerFloatMax();

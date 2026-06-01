/**
 * PowCaret1to1.ts
 * @java game/functions/ints/math/Pow.java  (@Alias alias = "^")
 *
 * Registers the "^" alias for Pow.
 * The "pow" key is already registered by Math1to1.ts; this file only adds
 * the caret syntax alias so (^ base exp) compiles correctly in the 1:1 path.
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import { registerInt1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1 } from "../../../../../compiler1to1.js";

/**
 * Pow1to1Caret — faithful 1:1 port of Pow.java for the "^" alias.
 * @java game/functions/ints/math/Pow.java — eval: (int)(Math.pow(a, b))
 */
export class Pow1to1Caret implements IntFunction {
  constructor(
    private readonly a: IntFunction,
    private readonly b: IntFunction,
  ) {}

  /** @java game/functions/ints/math/Pow.java — eval(Context) */
  public eval(ctx: Context): number {
    return Math.trunc(Math.pow(this.a.eval(ctx), this.b.eval(ctx)));
  }
}

// "^" is @Alias(alias = "^") on Pow.java — register under the caret key.
registerInt1to1("^", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const a = compileInt1to1(positional[0]);
  const b = compileInt1to1(positional[1]);
  return new Pow1to1Caret(a, b);
});

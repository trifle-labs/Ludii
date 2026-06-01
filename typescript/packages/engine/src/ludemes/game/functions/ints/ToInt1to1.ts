/**
 * ToInt1to1.ts
 * @java game/functions/ints/ToInt.java
 *
 * (toInt <boolFn>) — converts a boolean ludeme result to 1 (true) or 0 (false).
 *
 * The Java class also accepts a FloatFunction argument, but FloatFunction is
 * not implemented in the TS engine, so the float branch is deferred.
 */

import type { Context } from "../../../../context.js";
import type { IntFunction, BooleanFunction } from "../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import { registerInt1to1, type Compile1to1Env } from "../../../registry1to1.js";
import { parseArgs1to1, compileBool1to1 } from "../../../../compiler1to1.js";

/**
 * Converts a BooleanFunction to an integer: true → 1, false → 0.
 * @java game/functions/ints/ToInt.java — eval(Context): boolFn result → 0 or 1
 */
export class ToInt1to1 implements IntFunction {
  constructor(private readonly boolFn: BooleanFunction) {}

  /** @java game/functions/ints/ToInt.java — eval: boolFn.eval(context) ? 1 : 0 */
  public eval(ctx: Context): number {
    return this.boolFn.eval(ctx) ? 1 : 0;
  }
}

registerInt1to1("toint", (node: LudNode, env: Compile1to1Env): IntFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const arg = positional[0];
  if (arg) {
    try {
      const boolFn = compileBool1to1(arg, env.numPlayers);
      return new ToInt1to1(boolFn);
    } catch {
      // Argument is not a boolean — fall through
    }
  }
  // No recognisable argument: return 0 (mirrors Java fallback for malformed input)
  return { eval(_ctx: Context): number { return 0; } };
});

/**
 * If1to1.ts
 * @java game/functions/intArray/math/If.java
 *
 * (if <cond> <ok> [<notOk>]) — returns ok-array when condition is true, notOk otherwise.
 */

import type { Context } from "../../../../../context.js";
import type { IntArrayFunction, BooleanFunction } from "../../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";
import { registerIntArray1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import { compileIntArray1to1, compileBool1to1, parseArgs1to1 } from "../../../../../compiler1to1.js";

export class If1to1 implements IntArrayFunction {
  /** @java game/functions/intArray/math/If.java — eval(Context) */
  constructor(
    private readonly condition: BooleanFunction,
    private readonly ok: IntArrayFunction,
    private readonly notOk: IntArrayFunction,
  ) {}

  public eval(ctx: Context): number[] {
    // @java If.java:60-65
    if (this.condition.eval(ctx)) {
      return this.ok.eval(ctx);
    } else {
      return this.notOk.eval(ctx);
    }
  }
}

registerIntArray1to1("if", (node: LudNode, env: Compile1to1Env): IntArrayFunction => {
  const list = node as LudList;
  const { positional } = parseArgs1to1(list.items);
  const condFn = compileBool1to1(positional[0], env.numPlayers);
  const okFn = compileIntArray1to1(positional[1]);
  const notOkFn = positional[2] ? compileIntArray1to1(positional[2]) : { eval: (_ctx: Context) => [] as number[] };
  return new If1to1(condFn, okFn, notOkFn);
});

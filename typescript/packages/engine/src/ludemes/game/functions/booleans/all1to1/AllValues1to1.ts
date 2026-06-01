// @java Core/src/game/functions/booleans/all/values/AllValues.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction, RegionFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";
import { compileBool1to1, compileRegion1to1, parseArgs1to1 } from "../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../registry1to1.js";

/**
 * (all Values <intArrayFn> if:<cond>)
 * Returns true if all values in the integer array satisfy the condition.
 * Java's IntArrayFunction is represented here as a RegionFunction (int[]).
 * @java game/functions/booleans/all/values/AllValues.java
 */
export class AllValues1to1 implements BooleanFunction {
  /** @java AllValues.array — IntArrayFunction evaluated as an int[] */
  private readonly arrayFn: RegionFunction;
  /** @java AllValues.condition */
  private readonly condFn: BooleanFunction;

  public constructor(arrayFn: RegionFunction, condFn: BooleanFunction) {
    this.arrayFn = arrayFn;
    this.condFn = condFn;
  }

  /**
   * @java AllValues.eval(Context):
   *   int[] values = array.eval(context);
   *   int originValue = context.value();
   *   for (int v : values) {
   *     context.setValue(v);
   *     if (!condition.eval(context)) { context.setValue(originValue); return false; }
   *   }
   *   context.setValue(originValue);
   *   return true;
   */
  public eval(ctx: Context): boolean {
    const values = this.arrayFn.eval(ctx);
    const origValue = ctx._evalValue;

    for (const v of values) {
      ctx._evalValue = v;
      if (!this.condFn.eval(ctx)) {
        ctx._evalValue = origValue;
        return false;
      }
    }

    ctx._evalValue = origValue;
    return true;
  }
}

registerBool1to1("all:values", (node: LudNode, env: Compile1to1Env): BooleanFunction => {
  // node = (all Values <intArrayFn> if:<cond>)
  // positional[0] = "Values" ident, positional[1] = array node
  const { positional, named } = parseArgs1to1((node as LudList).items);
  const arrayNode = positional[1];
  const ifNode = named.get("if");

  if (!arrayNode || !ifNode) {
    throw new Error("compiler1to1: (all Values <array> if:<cond>) — missing args");
  }

  // Java IntArrayFunction is bridged to RegionFunction (int[]) in the 1:1 port
  const arrayFn = compileRegion1to1(arrayNode);
  const condFn = compileBool1to1(ifNode, env.numPlayers);
  return new AllValues1to1(arrayFn, condFn);
});

/**
 * Array1to1.ts
 * @java game/functions/intArray/array/Array.java
 *
 * (array <region>) converts a RegionFunction to an int[].
 * (array {int int ...}) builds an array from a list of IntFunctions.
 */

import type { Context } from "../../../../../context.js";
import type { IntArrayFunction, RegionFunction, IntFunction } from "../../../../base.js";
import { isList } from "@ludii/typescript-language";
import type { LudNode, LudList } from "@ludii/typescript-language";
import { registerIntArray1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import { compileRegion1to1, compileInt1to1, parseArgs1to1 } from "../../../../../compiler1to1.js";

export class Array1to1 implements IntArrayFunction {
  /** @java game/functions/intArray/array/Array.java — eval(Context) */
  constructor(
    private readonly region: RegionFunction | null,
    private readonly ints: IntFunction[] | null,
  ) {}

  public eval(ctx: Context): number[] {
    // @java Array.java:59-70
    if (this.region !== null) {
      return this.region.eval(ctx);
    } else {
      const arr: number[] = new Array(this.ints!.length);
      for (let i = 0; i < arr.length; i++) {
        arr[i] = this.ints![i]!.eval(ctx);
      }
      return arr;
    }
  }
}

registerIntArray1to1("array", (node: LudNode, _env: Compile1to1Env): IntArrayFunction => {
  const list = node as LudList;
  const { positional } = parseArgs1to1(list.items);
  const first = positional[0];
  if (!first) return new Array1to1(null, []);
  // (array {int int ...}) — curly list of int expressions
  if (isList(first) && first.delimiter === "curly") {
    const ints: IntFunction[] = first.items.map(it => compileInt1to1(it));
    return new Array1to1(null, ints);
  }
  // (array <region>) — wrap region as array
  const region = compileRegion1to1(first);
  return new Array1to1(region, null);
});

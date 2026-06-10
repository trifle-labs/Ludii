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

export class Array1to1 implements IntArrayFunction {
  private readonly region: RegionFunction | null;
  private readonly ints: IntFunction[] | null;

  /**
   * @java Array.java — Java declares two 1-arg constructors: Array(RegionFunction region)
   * and Array(IntFunction[] array). TS cannot overload, so this single 1-arg constructor
   * accepts either and dispatches on the runtime shape (arity 1, matching Java).
   */
  constructor(arg: RegionFunction | readonly IntFunction[]) {
    if (Array.isArray(arg)) {
      this.region = null;
      this.ints = arg as IntFunction[];
    } else {
      this.region = arg as RegionFunction;
      this.ints = null;
    }
  }

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


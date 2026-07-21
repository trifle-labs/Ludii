// @java Core/src/game/functions/ints/size/array/SizeArray.java

import type { Context } from "../../../../../../context.js";
import type { IntFunction, RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import { isIdent, isList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import type { Game } from "../../../../../Game.js";

export class SizeArray implements IntFunction {
  private readonly regionFn: RegionFunction;

  public constructor(regionFn: RegionFunction) {
    this.regionFn = regionFn;
  }

  /** @java game/functions/ints/size/array/SizeArray.java — eval: array.eval(context).length */
  public eval(ctx: Context): number {
    return this.regionFn.eval(ctx).length;
  }
}

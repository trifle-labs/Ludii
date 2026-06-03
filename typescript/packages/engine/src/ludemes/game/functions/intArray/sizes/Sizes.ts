// @java Core/src/game/functions/intArray/sizes/Sizes.java

/**
 * Returns an array of sizes of many regions.
 *
 * @java game/functions/intArray/sizes/Sizes.java
 *
 * Java parity: Sizes is a factory class — its static construct() method
 * dispatches on SizesGroupType.Group to create a SizesGroup instance.
 * The class itself has a no-op private constructor and a stub eval() that
 * throws UnsupportedOperationException (should never be called directly).
 */

import type { Context } from "../../../../../context.js";
import type { EvalScratch, BooleanFunction, IntFunction } from "../../../../base.js";
import { BaseIntArrayFunction } from "../BaseIntArrayFunction.js";
import { SizesGroupType } from "./SizesGroupType.js";
import { SizesGroup } from "./group/SizesGroup.js";

/**
 * Factory for int-array size ludemes.
 * @java game.functions.intArray.sizes.Sizes
 */
export class Sizes extends BaseIntArrayFunction {
  /**
   * @java Sizes.construct(SizesGroupType, SiteType, Direction, RoleType, IntFunction, BooleanFunction, IntFunction, BooleanFunction)
   *
   * Factory method: constructs the appropriate sub-type.
   *
   * @param sizesType  The kind of size to compute (currently only Group).
   * @param siteType   Graph element type ("Cell"/"Vertex"/"Edge" or null).
   * @param directions Direction set name (e.g. "Orthogonal", "Adjacent").
   * @param whoFn      Player index function (null → all-players mode).
   * @param minFn      Minimum group size to include (null → 0).
   * @param condition  Optional membership condition.
   * @param allPieces  When true, consider pieces of all players.
   * @param isVisibleFn Optional 3D visibility condition.
   */
  public static construct(
    sizesType: SizesGroupType,
    siteType: string | null,
    directions: string,
    whoFn: IntFunction,
    minFn: IntFunction,
    condition: BooleanFunction | null,
    allPieces: boolean,
    isVisibleFn: BooleanFunction | null,
  ): BaseIntArrayFunction {
    switch (sizesType) {
      case SizesGroupType.Group:
        return new SizesGroup(siteType, directions, whoFn, minFn, condition, allPieces, isVisibleFn);
      default:
        throw new Error(`Sizes.construct(): SizesGroupType '${sizesType as string}' not implemented.`);
    }
  }

  /**
   * Private constructor — grammar picks up construct() instead.
   * @java Sizes() — private
   */
  private constructor() {
    super();
  }

  /**
   * @java Sizes.eval(Context) — should never be called directly.
   */
  public override eval(_ctx: Context & EvalScratch): number[] {
    throw new Error("Sizes.eval(): Should never be called directly — use construct() to obtain a SizesGroup.");
  }
}

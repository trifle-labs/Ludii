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
    role: string | IntFunction | null,
    of: IntFunction | null,
    ifCond: BooleanFunction | null,
    min: IntFunction | null,
    isVisibleFn: BooleanFunction | null,
  ): BaseIntArrayFunction {
    // @java Sizes.java:44-56,70 — the factory takes the RAW grammar arguments
    // (role, of, If, min, isVisible); SizesGroup's own constructor
    // (SizesGroup.java:78-97) derives whoFn/minFn/condition/allPieces from
    // them. The old TS signature assumed pre-resolved args, so the reflection
    // compiler's positional raw tuple landed shifted: minFn got `of`,
    // allPieces got `min` — corrupting (sizes Group …) filtering (SnipSnip's
    // line-clearing WINNER_MISMATCH @17).
    let whoFn: IntFunction;
    let allPieces: boolean;
    const roleStr = typeof role === "string" ? role : null;
    const roleFn = role !== null && typeof role !== "string" ? role : null;
    if (of !== null) {
      whoFn = of;
      allPieces = false;
    } else if (roleFn !== null) {
      whoFn = roleFn;
      allPieces = false;
    } else if (roleStr === "All" || roleStr === "Shared") {
      whoFn = { eval: () => -1 } as unknown as IntFunction;
      allPieces = true;
    } else if (roleStr !== null) {
      whoFn = roleStrToIntFunction(roleStr);
      allPieces = false;
    } else {
      // @java role==null && of==null && If==null → whoFn = Id(null, All)
      whoFn = { eval: () => -1 } as unknown as IntFunction;
      allPieces = true;
    }
    const minFn: IntFunction = min ?? ({ eval: () => 0 } as unknown as IntFunction);
    const condition = ifCond;
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

  /** For tests/direct callers that already resolved the arguments. */
  public static constructResolved(
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
   * @java Sizes.eval(Context) — should never be called directly.
   */
  public override eval(_ctx: Context & EvalScratch): number[] {
    throw new Error("Sizes.eval(): Should never be called directly — use construct() to obtain a SizesGroup.");
  }
}

/**
 * @java RoleType.toIntFunction — P\d+ → owner constant; contextual roles read
 * the state at eval time.
 */
function roleStrToIntFunction(role: string): IntFunction {
  return {
    eval(ctx: Context & EvalScratch): number {
      const m = /^P(\d+)$/.exec(role);
      if (m) return Number(m[1]);
      if (role === "Neutral") return 0;
      if (role === "Mover") return ctx.state.mover;
      if (role === "Next") {
        const nx = (ctx.state as unknown as { next: number }).next;
        const n = (ctx.game as unknown as { numPlayers: number }).numPlayers;
        return nx > 0 ? nx : (ctx.state.mover % n) + 1;
      }
      if (role === "Prev") {
        const n = (ctx.game as unknown as { numPlayers: number }).numPlayers;
        return ((ctx.state.mover - 2 + n) % n) + 1;
      }
      return ctx.state.mover;
    },
  } as unknown as IntFunction;
}

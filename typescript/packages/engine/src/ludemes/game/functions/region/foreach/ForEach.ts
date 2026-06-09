// @java Core/src/game/functions/region/foreach/ForEach.java

/**
 * Returns a region filtering with a condition or built according to different
 * player/team/level indices. This class is a dispatch facade — it should never
 * be eval()‑ed directly; only its static construct() results are used.
 *
 * @java game/functions/region/foreach/ForEach.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import type { BooleanFunction, EvalScratch, IntArrayFunction, IntFunction, RegionFunction } from "../../../../base.js";
import { BaseBooleanFunction } from "../../booleans/BaseBooleanFunction.js";
import { BooleanConstant } from "../../booleans/BooleanConstant.js";
import { BaseIntArrayFunction } from "../../intArray/BaseIntArrayFunction.js";
import { BaseRegionFunction } from "../BaseRegionFunction.js";
import { StackDirection } from "../../../util/directions/StackDirection.js";
import { ForEachLevel } from "./level/ForEachLevel.js";
import { ForEachPlayer } from "./player/ForEachPlayer.js";
import { ForEachSite } from "./sites/ForEachSite.js";
import { ForEachSiteInRegion } from "./sites/ForEachSiteInRegion.js";
import { ForEachTeam } from "./team/ForEachTeam.js";

function hasEval(value: unknown): value is { eval(ctx: Context & EvalScratch): unknown } {
  return typeof (value as { eval?: unknown } | null)?.eval === "function";
}

function asIntFunction(value: unknown): IntFunction | null {
  if (hasEval(value)) return value as IntFunction;
  if (typeof value === "number") return { eval: () => value };
  return null;
}

function asBooleanFunction(value: unknown): BooleanFunction | null {
  if (typeof value === "boolean") return new BooleanConstant(value);
  if (hasEval(value)) return value as BooleanFunction;
  return null;
}

function isBooleanFunction(value: unknown): boolean {
  if (typeof value === "boolean" || value instanceof BaseBooleanFunction) return true;
  if (!hasEval(value) || value instanceof BaseRegionFunction || value instanceof BaseIntArrayFunction) return false;
  const ctorName = (value as { constructor?: { name?: string } }).constructor?.name ?? "";
  return /^(All|And|Can|Equals|False|Ge|Gt|IfBool|Is|Le|Lt|No|Not|NotEqual|Or|ToBool|True|Was|Xor)/.test(ctorName);
}

function isRegionFunction(value: unknown): value is RegionFunction {
  if (value instanceof BaseIntArrayFunction) return false;
  return value instanceof BaseRegionFunction || (hasEval(value) && !isBooleanFunction(value));
}

function asStackDirection(value: unknown): StackDirection | null {
  switch (value) {
    case null:
    case undefined:
      return null;
    case StackDirection.FromBottom:
    case "FromBottom":
      return StackDirection.FromBottom;
    case StackDirection.FromTop:
    case "FromTop":
      return StackDirection.FromTop;
    default:
      return null;
  }
}

/**
 * Dispatch-only class. In Java the static construct() overloads select a
 * concrete subclass (ForEachLevel, ForEachTeam, ForEachSite,
 * ForEachSiteInRegion, ForEachPlayer). This TS version mirrors that: the class
 * itself throws on eval() and every static factory returns the matching
 * subclass instance.
 *
 * @java game.functions.region.foreach.ForEach
 */
export class ForEach extends BaseRegionFunction {
  private constructor() {
    super();
  }

  /**
   * @java ForEach.construct(ForEachLevelType, SiteType, IntFunction,
   *   StackDirection, BooleanFunction, IntFunction)
   */
  public static constructLevel(
    forEachType: string,
    type: string | null,
    at: IntFunction | number,
    stackDirection: StackDirection | string | null,
    If: BooleanFunction | boolean | null,
    startAt: IntFunction | number | null,
  ): RegionFunction | null {
    if (forEachType !== "Level") return null;
    const atFn = asIntFunction(at);
    if (atFn === null) return null;
    return new ForEachLevel(
      type,
      atFn,
      asStackDirection(stackDirection),
      asBooleanFunction(If),
      asIntFunction(startAt),
    );
  }

  /**
   * @java ForEach.construct(ForEachTeamType, RegionFunction)
   */
  public static constructTeam(
    forEachType: string,
    region: RegionFunction,
  ): RegionFunction | null {
    if (forEachType !== "Team" || !isRegionFunction(region)) return null;
    return new ForEachTeam(region);
  }

  /**
   * @java ForEach.construct(@Name RegionFunction of, RegionFunction region)
   */
  public static constructSiteInRegion(
    of: RegionFunction,
    region: RegionFunction,
  ): RegionFunction | null {
    if (!isRegionFunction(of) || !isRegionFunction(region)) return null;
    return new ForEachSiteInRegion(of, region);
  }

  /**
   * @java ForEach.construct(RegionFunction region, @Name BooleanFunction If)
   */
  public static constructSite(
    region: RegionFunction,
    If: BooleanFunction | boolean,
  ): RegionFunction | null {
    if (!isRegionFunction(region) || !isBooleanFunction(If)) return null;
    const condition = asBooleanFunction(If);
    if (condition === null) return null;
    return new ForEachSite(region, condition);
  }

  /**
   * @java ForEach.construct(IntArrayFunction players, RegionFunction region)
   */
  public static constructPlayer(
    players: IntArrayFunction,
    region: RegionFunction,
  ): RegionFunction | null {
    if (!(players instanceof BaseIntArrayFunction) || !isRegionFunction(region)) return null;
    return new ForEachPlayer(players, region);
  }

  /**
   * @java ForEach.eval(Context)
   * Should never be called — ForEach is a pure dispatch class.
   */
  public override eval(_ctx: Context & EvalScratch): number[] {
    // @java ForEach.java:139-141 — throw if called directly
    throw new Error("ForEach.eval(): Should never be called directly.");
  }

  /** @java ForEach.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}

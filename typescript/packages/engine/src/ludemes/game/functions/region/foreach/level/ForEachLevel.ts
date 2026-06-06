// @java Core/src/game/functions/region/foreach/level/ForEachLevel.java

/**
 * Iterates through the levels of a stack at a site, generating a region based
 * on indices of levels that satisfy a condition.
 *
 * @java game/functions/region/foreach/level/ForEachLevel.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, IntFunction, BooleanFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";
import { StackDirection } from "../../../../util/directions/StackDirection.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Iterates through the levels of a stack at the given site.
 * @java game.functions.region.foreach.level.ForEachLevel
 */
export class ForEachLevel extends BaseRegionFunction {
  /** @java ForEachLevel — private final IntFunction siteFn */
  private readonly siteFn: IntFunction;
  /** @java ForEachLevel — private final BooleanFunction cond */
  private readonly cond: BooleanFunction | null;
  /** @java ForEachLevel — private final StackDirection stackDirection */
  private readonly stackDirection: StackDirection;
  /** @java ForEachLevel — private final IntFunction startAtFn */
  private readonly startAtFn: IntFunction;

  /**
   * @java ForEachLevel(SiteType, IntFunction, StackDirection, BooleanFunction, IntFunction)
   * @param siteType       Site type (Cell/Vertex/Edge), or null for board default.
   * @param siteFn         The site to iterate levels at.
   * @param stackDirection The direction to traverse the stack.
   * @param cond           Optional condition each level must satisfy.
   * @param startAtFn      The level to start at, or null for default.
   */
  public constructor(
    siteType: string | null,
    siteFn: IntFunction,
    stackDirection: StackDirection | null,
    cond: BooleanFunction | null,
    startAtFn: IntFunction | null,
  ) {
    super();
    this.siteType = siteType;
    this.siteFn = siteFn;
    this.cond = cond;
    this.stackDirection = stackDirection ?? StackDirection.FromTop;
    // Java: startAt = (startAt == null) ? new IntConstant(Constants.UNDEFINED) : startAt
    this.startAtFn = startAtFn ?? { eval: (_ctx: Context & EvalScratch) => UNDEFINED };
  }

  /**
   * @java ForEachLevel.eval(Context)
   * Iterates through the stack levels at the given site, collecting those that
   * satisfy the optional condition.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const returnLevels: number[] = [];
    const site = this.siteFn.eval(ctx);

    // @java ForEachLevel.java:72-77 — resolve realType from containerId
    const ctxAny = ctx as unknown as {
      containerId?: () => number[];
      containerState?: (cid: number) => { sizeStack: (site: number, type: string | null) => number };
      board?: () => { defaultSite?: () => string };
      setLevel?: (lvl: number) => void;
      level?: () => number;
    };
    const containerIds = ctxAny.containerId?.() ?? [];
    const cid = site >= containerIds.length ? 0 : (containerIds[site] ?? 0);

    let realType = this.siteType;
    if (cid > 0) {
      realType = "Cell";
    } else if (realType === null) {
      realType = ctxAny.board?.()?.defaultSite?.() ?? "Cell";
    }

    // @java ForEachLevel.java:78-79 — get stack size and saved level
    const cs = ctxAny.containerState?.(cid);
    const stackSize = cs?.sizeStack(site, realType) ?? 0;
    const originLevel = ctxAny.level?.() ?? 0;
    let startAt = this.startAtFn.eval(ctx);

    // @java ForEachLevel.java:81-100 — iterate FromBottom or FromTop
    if (this.stackDirection === StackDirection.FromBottom) {
      startAt = startAt < 0 ? 0 : startAt;
      for (let lvl = startAt; lvl < stackSize; lvl++) {
        ctxAny.setLevel?.(lvl);
        if (this.cond === null || this.cond.eval(ctx)) {
          returnLevels.push(lvl);
        }
      }
    } else {
      startAt = startAt < 0 ? stackSize - 1 : startAt;
      startAt = startAt >= stackSize ? stackSize - 1 : startAt;
      for (let lvl = startAt; lvl >= 0; lvl--) {
        ctxAny.setLevel?.(lvl);
        if (this.cond === null || this.cond.eval(ctx)) {
          returnLevels.push(lvl);
        }
      }
    }

    // @java ForEachLevel.java:103 — restore level
    ctxAny.setLevel?.(originLevel);
    return returnLevels;
  }

  /** @java ForEachLevel.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}

// @java Core/src/game/functions/region/BaseRegionFunction.java

/**
 * Default implementations of region functions — override where necessary.
 *
 * @java game/functions/region/BaseRegionFunction.java
 *
 * Java parity: abstract class BaseRegionFunction extends BaseLudeme implements
 * RegionFunction. Provides default implementations for contains(), isHand(),
 * isStatic(), and type(). In TS there is no BaseLudeme layer.
 */

import type { Context } from "../../../../context.js";
import type { EvalScratch, RegionFunction } from "../../../base.js";

/**
 * Abstract base for all RegionFunction implementations.
 * @java game.functions.region.BaseRegionFunction
 */
export abstract class BaseRegionFunction implements RegionFunction {
  /**
   * Cell, Edge, or Vertex type for this region.
   * @java BaseRegionFunction — protected SiteType type
   */
  protected siteType: string | null = null;

  /** @java BaseRegionFunction — eval() abstract */
  public abstract eval(ctx: Context & EvalScratch): number[];

  /**
   * @java BaseRegionFunction.contains(Context, int)
   * Default: evaluate the region and check for membership.
   */
  public contains(ctx: Context & EvalScratch, location: number): boolean {
    return this.eval(ctx).includes(location);
  }

  /**
   * @java BaseRegionFunction.isStatic()
   * Default: not static. Subclasses override when their value never changes.
   */
  public isStatic(): boolean {
    return false;
  }

  /**
   * @java BaseRegionFunction.isHand()
   * Default: not a hand. Subclasses that wrap hand containers override this.
   */
  public isHand(): boolean {
    return false;
  }

  /**
   * @java BaseRegionFunction.type(Game)
   * Returns the site type of this region. If siteType is set, returns that;
   * otherwise falls back to the game's board default site type.
   */
  public type(ctx: Context & EvalScratch): string {
    if (this.siteType !== null) return this.siteType;
    const ctxAny = ctx as unknown as Record<string, unknown>;
    if (typeof ctxAny["board"] === "function") {
      const board = (ctxAny["board"] as () => unknown)() as { defaultSite?(): string };
      if (typeof board.defaultSite === "function") return board.defaultSite();
    }
    return "Cell";
  }
}

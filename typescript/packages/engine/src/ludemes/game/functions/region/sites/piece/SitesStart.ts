// @java Core/src/game/functions/region/sites/piece/SitesStart.java

/**
 * Returns the sites that a specified component starts on.
 *
 * @java game/functions/region/sites/piece/SitesStart.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction, EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/**
 * Returns the sites that a specified component starts on.
 *
 * @java game/functions/region/sites/piece/SitesStart.java
 *
 * Java parity: indexFn comes from piece.component() (i.e. the IntFunction for
 *   the piece's component index). eval returns context.trial().startingPos().get(index).
 */
export class SitesStart extends BaseRegionFunction {
  /** @java SitesStart — precomputedRegion (cached after preprocess if static) */
  private precomputedRegion: number[] | null = null;

  /** @java SitesStart — indexFn (index of the component) */
  private readonly indexFn: IntFunction | null;

  /**
   * @param indexFn The index function of the component (from Piece.component()).
   * @java SitesStart(Piece) — indexFn = piece.component()
   */
  public constructor(indexFn: IntFunction | null) {
    super();
    this.indexFn = indexFn;
  }

  /**
   * Returns the sites that the component starts on.
   *
   * @java SitesStart.eval(Context)
   *
   * Java parity:
   *   if (precomputedRegion != null) return precomputedRegion;
   *   if (indexFn == null) return new Region();
   *   final int index = indexFn.eval(context);
   *   if (index < 1 || index >= context.components().length) return new Region();
   *   return context.trial().startingPos().get(index);
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java if (precomputedRegion != null) return precomputedRegion
    if (this.precomputedRegion !== null) {
      return this.precomputedRegion;
    }

    // @java if (indexFn == null) return new Region()
    if (this.indexFn === null) {
      return [];
    }

    // @java final int index = indexFn.eval(context)
    const index = this.indexFn.eval(ctx);

    // @java if (index < 1 || index >= context.components().length) return new Region()
    const components = (ctx as unknown as {
      components?: () => unknown[];
      _components?: unknown[];
    }).components?.() ?? (ctx as unknown as { _components?: unknown[] })._components;

    if (components !== undefined && (index < 1 || index >= components.length)) {
      return [];
    }

    // @java return context.trial().startingPos().get(index)
    const startingPos = (ctx.trial as unknown as {
      startingPos?: () => Array<number[] | { sites?: number[]; toArray?(): number[] }>;
      _startingPos?: Array<number[] | { sites?: number[]; toArray?(): number[] }>;
    }).startingPos?.()
      ?? (ctx.trial as unknown as { _startingPos?: Array<number[]> })._startingPos;

    if (!startingPos || index >= startingPos.length) {
      return [];
    }

    const posEntry = startingPos[index];
    if (!posEntry) return [];

    // Handle both plain number[] and Region-like objects
    if (Array.isArray(posEntry)) {
      return posEntry as number[];
    }
    // @java Region.sites() or Region.toArray()
    const regionLike = posEntry as { sites?: number[]; toArray?(): number[] };
    if (Array.isArray(regionLike.sites)) return regionLike.sites;
    if (typeof regionLike.toArray === "function") return regionLike.toArray();

    return [];
  }

  /**
   * @java SitesStart.isStatic()
   */
  public override isStatic(): boolean {
    if (this.indexFn !== null) {
      return (this.indexFn as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
    }
    return false;
  }

  /** @java SitesStart.toString() */
  public override toString(): string {
    return "StartingPosition()";
  }
}

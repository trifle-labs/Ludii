/**
 * @java game/equipment/other/Regions.java Regions
 *
 * A static or function-based region bound to a name/role in the equipment.
 * In the 1:1 data path we store either:
 *   - an explicit array of site indices (`sites`), or
 *   - a RegionFunction to be evaluated at runtime (`region`).
 *
 * computeStatic() pre-computes and caches the result when the region is static.
 *
 * @java game/equipment/other/Regions.java — constructor/sites/region/eval/contains/isStatic
 */

import { Item1to1 } from "../Item1to1.js";
import type { RegionFunction } from "../../../base.js";
import type { Context } from "../../../../context.js";
import type { EvalScratch } from "../../../base.js";

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

export class Regions1to1 extends Item1to1 {
  /**
   * @java Regions.sites — explicit site list (null if function-based).
   */
  private readonly _sites: readonly number[] | null;

  /**
   * @java Regions.region — array of RegionFunction(s) (null if site-list-based).
   */
  private readonly _region: readonly RegionFunction[] | null;

  /** @java Regions.precomputedRegion — cached eval result for static regions */
  private _precomputed: readonly number[] | null = null;

  /** 1-based player owner for player-specific regions (0 = neutral). */
  public readonly playerOwner: number;

  /**
   * @java game/equipment/other/Regions.java constructor (simplified to two paths)
   *
   * @param name        Optional name.
   * @param role        Owner player id (0 = neutral/shared).
   * @param sites       Explicit site indices (null if using region function).
   * @param regionFns   Region function(s) (null if using site list).
   */
  public constructor(
    name: string | null,
    role: number,
    sites: readonly number[] | null,
    regionFns: readonly RegionFunction[] | null,
  ) {
    // @java Regions.java:83–84 — super(name, ...)
    super(
      name ?? ("Region" + role),
      UNDEFINED,
      role,
    );
    this.playerOwner = role;
    this._sites  = sites   ? [...sites]   : null;
    this._region = regionFns ? [...regionFns] : null;
    this.setType("Regions");
  }

  /** @java Regions.sites() */
  public sites(): readonly number[] | null { return this._sites; }

  /** @java Regions.region() */
  public region(): readonly RegionFunction[] | null { return this._region; }

  /**
   * @java Regions.eval(Context)
   *
   * Returns site indices. Uses precomputed cache if available.
   * If function-based, evaluates and deduplicates (mirrors Java Region wrapper).
   */
  public eval(context: Context & EvalScratch): readonly number[] {
    // @java Regions.java:388–392 — return precomputed if cached
    if (this._precomputed !== null) return this._precomputed;

    if (this._region !== null) {
      // @java Regions.java:395–420 — union of region evals, deduplicated
      const seen = new Set<number>();
      for (const fn of this._region) {
        for (const site of fn.eval(context)) {
          seen.add(site);
        }
      }
      return [...seen];
    } else {
      return this._sites ?? [];
    }
  }

  /**
   * @java Regions.contains(Context, int)
   *
   * Returns true if the given site is in this region.
   */
  public contains(context: Context & EvalScratch, location: number): boolean {
    // @java Regions.java:436–456
    if (this._region !== null) {
      for (const fn of this._region) {
        const sites = fn.eval(context);
        if (sites.includes(location)) return true;
      }
      return false;
    } else {
      return (this._sites ?? []).includes(location);
    }
  }

  /**
   * @java Regions.isStatic() — always returns true (Java leaves it stubbed as true).
   */
  public isStatic(): boolean { return true; }

  /**
   * @java Regions.preprocess(Game)
   *
   * Pre-compute the region if static (pass a dummy context).
   * In the TS path, callers can invoke this with a bootstrapped context.
   */
  public precompute(context: Context & EvalScratch): void {
    // @java Regions.java:483–492 — preprocess
    if (this.isStatic()) {
      this._precomputed = [...this.eval(context)];
    }
  }
}

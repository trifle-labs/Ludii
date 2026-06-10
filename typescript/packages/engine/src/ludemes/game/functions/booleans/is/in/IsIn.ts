// @java Core/src/game/functions/booleans/is/in/IsIn.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction, RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";

/**
 * (is In <site> <region>)
 * Tests if a site (or set of sites) is in a region.
 * Default site = context._evalTo if omitted.
 * @java game/functions/booleans/is/in/IsIn.java
 */
/** Normalise a region eval result (bespoke number[] or faithful Region object) to number[]. */
function toSiteArray(raw: unknown): readonly number[] {
  if (Array.isArray(raw)) return raw as number[];
  if (raw && typeof raw === "object") {
    const r = raw as { sites?: unknown; array?: unknown };
    if (typeof r.sites === "function") return (r.sites as () => number[])();
    if (Array.isArray(r.sites)) return r.sites as number[];
    if (Array.isArray(r.array)) return r.array as number[];
    if (typeof (raw as Iterable<number>)[Symbol.iterator] === "function") return [...(raw as Iterable<number>)];
  }
  return [];
}

export class IsIn implements BooleanFunction {
  /** @java IsIn.sites — site(s) to check */
  private readonly siteFn: IntFunction;
  /** @java IsIn.region */
  private readonly regionFn: RegionFunction;

  public constructor(siteFn: IntFunction, regionFn: RegionFunction) {
    this.siteFn = siteFn;
    this.regionFn = regionFn;
  }

  /**
   * @java IsIn (InSingleSite) eval(Context):
   *   location = site.eval(ctx); location != OFF && region.eval(ctx).bitSet().get(location)
   */
  // Normalise a region eval result to a number[] of site indices.
  // Handles: number[] (bespoke), { sites(): number[] }, { array: number[] }, and any iterable.
  // @java game/util/equipment/Region — sites()/bitSet() accessors.
  // (declared as a free helper below)

  public eval(ctx: Context): boolean {
    const location = this.siteFn.eval(ctx);
    if (location < 0) return false; // Constants.OFF
    // The region function may return a plain number[] (bespoke) OR a faithful Region
    // object (sites()/array/bitSet) when the game compiled via the faithful path.
    // Normalise to a number[] so `(is In ...)` works regardless of which path produced it.
    const raw = this.regionFn.eval(ctx) as unknown;
    const sites = toSiteArray(raw);
    return sites.includes(location);
  }
}


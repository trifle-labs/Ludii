/**
 * From1to1.ts
 * @java game/util/moves/From.java
 *
 * Parameter holder for the ``from'' clause of move generators.
 * Specifies the from location/region, optional level and condition.
 *
 * This is a data class — no eval(ctx). Move generators read it.
 */

import type { BooleanFunction, IntFunction, RegionFunction } from "../../../base.js";

/** Graph element type (mirrors Java SiteType). */
export type SiteType1to1 = "Cell" | "Vertex" | "Edge";

/**
 * Specifies operations based on the ``from'' location.
 * @java game/util/moves/From.java
 */
export class From1to1 {
  /** @java From.loc — the from location (IntFunction). */
  private readonly loc: IntFunction | null;

  /** @java From.region — the from region (RegionFunction). */
  private readonly region: RegionFunction | null;

  /** @java From.level — the level of the from location. */
  private readonly level: IntFunction | null;

  /** @java From.cond — the condition on the from location. */
  private readonly cond: BooleanFunction | null;

  /** @java From.type — the graph element type. */
  private readonly type: SiteType1to1 | null;

  /**
   * @java game/util/moves/From.java — constructor
   *
   * Java default: if region == null and loc == null, defaults to iterator From.
   * We store null for both in that case; callers read _evalFrom from context.
   */
  public constructor(opts: {
    loc?: IntFunction | null;
    region?: RegionFunction | null;
    level?: IntFunction | null;
    cond?: BooleanFunction | null;
    type?: SiteType1to1 | null;
  } = {}) {
    this.loc = opts.loc ?? null;
    this.region = opts.region ?? null;
    this.level = opts.level ?? null;
    this.cond = opts.cond ?? null;
    this.type = opts.type ?? null;
  }

  /** @java From.loc() */
  public locFn(): IntFunction | null {
    return this.loc;
  }

  /** @java From.region() */
  public regionFn(): RegionFunction | null {
    return this.region;
  }

  /** @java From.level() */
  public levelFn(): IntFunction | null {
    return this.level;
  }

  /** @java From.cond() */
  public condFn(): BooleanFunction | null {
    return this.cond;
  }

  /** @java From.type() */
  public siteType(): SiteType1to1 | null {
    return this.type;
  }
}

/**
 * From.ts
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
export class From {
  /** @java From.loc — the from location (IntFunction). */
  private readonly locValue: IntFunction | null;

  /** @java From.region — the from region (RegionFunction). */
  private readonly regionValue: RegionFunction | null;

  /** @java From.level — the level of the from location. */
  private readonly levelValue: IntFunction | null;

  /** @java From.cond — the condition on the from location. */
  private readonly condValue: BooleanFunction | null;

  /** @java From.type — the graph element type. */
  private readonly typeValue: SiteType1to1 | null;

  /**
   * @java game/util/moves/From.java — constructor
   *
   * Java default: if region == null and loc == null, defaults to iterator From.
   * We store null for both in that case; callers read _evalFrom from context.
   */
  public constructor(
    type: SiteType1to1 | { loc?: IntFunction | null; region?: RegionFunction | null; level?: IntFunction | null; cond?: BooleanFunction | null; type?: SiteType1to1 | null } | null,
    region?: RegionFunction | null,
    loc?: IntFunction | null,
    level?: IntFunction | null,
    If?: BooleanFunction | null
  ) {
    if (typeof type === "object" && type !== null) {
      this.locValue = type.region != null ? null : (type.loc ?? { eval: (ctx) => ctx._evalFrom });
      this.regionValue = type.region ?? null;
      this.levelValue = type.level ?? null;
      this.condValue = type.cond ?? null;
      this.typeValue = type.type ?? null;
      return;
    }
    this.locValue = region != null ? null : (loc ?? { eval: (ctx) => ctx._evalFrom });
    this.regionValue = region ?? null;
    this.levelValue = level ?? null;
    this.condValue = If ?? null;
    this.typeValue = type ?? null;
  }

  /** @java From.loc() */
  public locFn(): IntFunction | null {
    return this.locValue;
  }

  /** @java From.loc() */
  public loc(): IntFunction | null {
    return this.locValue;
  }

  /** @java From.region() */
  public regionFn(): RegionFunction | null {
    return this.regionValue;
  }

  /** @java From.region() */
  public region(): RegionFunction | null {
    return this.regionValue;
  }

  /** @java From.level() */
  public levelFn(): IntFunction | null {
    return this.levelValue;
  }

  /** @java From.level() */
  public level(): IntFunction | null {
    return this.levelValue;
  }

  /** @java From.cond() */
  public condFn(): BooleanFunction | null {
    return this.condValue;
  }

  /** @java From.cond() */
  public cond(): BooleanFunction | null {
    return this.condValue;
  }

  /** @java From.type() */
  public siteType(): SiteType1to1 | null {
    return this.typeValue;
  }

  /** @java From.type() */
  public type(): SiteType1to1 | null {
    return this.typeValue;
  }
}

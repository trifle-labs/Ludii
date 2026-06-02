/**
 * To1to1.ts
 * @java game/util/moves/To.java
 *
 * Parameter holder for the ``to'' clause of move generators.
 * Specifies the to location/region, optional level, condition,
 * rotations, graph element type, and effect.
 *
 * This is a data class — no eval(ctx). Move generators read it.
 */

import type { BooleanFunction, IntFunction, RegionFunction } from "../../../base.js";
import type { SiteType1to1 } from "./From1to1.js";

/**
 * Specifies operations based on the ``to'' location.
 * @java game/util/moves/To.java
 */
export class To1to1 {
  /** @java To.loc — the to location (IntFunction). */
  private readonly loc: IntFunction | null;

  /** @java To.region — the to region (RegionFunction). */
  private readonly region: RegionFunction | null;

  /** @java To.level — the level of the to location. */
  private readonly level: IntFunction | null;

  /** @java To.cond — the condition on the to location. */
  private readonly cond: BooleanFunction | null;

  /** @java To.type — the graph element type. */
  private readonly type: SiteType1to1 | null;

  /** @java To.effect — the effect to apply on the to locations. */
  private readonly effect: (() => void) | null;

  /**
   * @java game/util/moves/To.java — constructor
   *
   * Java default: if region == null and loc == null, defaults to iterator To
   * (reads context._evalTo). We store null for both in that case.
   */
  public constructor(opts: {
    loc?: IntFunction | null;
    region?: RegionFunction | null;
    level?: IntFunction | null;
    cond?: BooleanFunction | null;
    type?: SiteType1to1 | null;
    effect?: (() => void) | null;
  } = {}) {
    this.loc = opts.loc ?? null;
    this.region = opts.region ?? null;
    this.level = opts.level ?? null;
    this.cond = opts.cond ?? null;
    this.type = opts.type ?? null;
    this.effect = opts.effect ?? null;
  }

  /** @java To.loc() */
  public locFn(): IntFunction | null {
    return this.loc;
  }

  /** @java To.region() */
  public regionFn(): RegionFunction | null {
    return this.region;
  }

  /** @java To.level() */
  public levelFn(): IntFunction | null {
    return this.level;
  }

  /** @java To.cond() */
  public condFn(): BooleanFunction | null {
    return this.cond;
  }

  /** @java To.type() */
  public siteType(): SiteType1to1 | null {
    return this.type;
  }

  /** @java To.effect() */
  public effectFn(): (() => void) | null {
    return this.effect;
  }
}

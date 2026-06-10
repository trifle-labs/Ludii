/**
 * To.ts
 * @java game/util/moves/To.java
 *
 * Parameter holder for the ``to'' clause of move generators.
 * Specifies the to location/region, optional level, condition,
 * rotations, graph element type, and effect.
 *
 * This is a data class — no eval(ctx). Move generators read it.
 */

import type { BooleanFunction, IntFunction, RegionFunction } from "../../../base.js";
import type { Apply } from "../../rules/play/moves/nonDecision/effect/Apply.js";
import type { SiteType1to1 } from "./From.js";

export interface RotationsLike {
  eval(ctx: unknown): unknown;
}

/**
 * Specifies operations based on the ``to'' location.
 * @java game/util/moves/To.java
 */
export class To {
  /** @java To.loc — the to location (IntFunction). */
  private readonly locValue: IntFunction | null;

  /** @java To.region — the to region (RegionFunction). */
  private readonly regionValue: RegionFunction | null;

  /** @java To.level — the level of the to location. */
  private readonly levelValue: IntFunction | null;

  /** @java To.cond — the condition on the to location. */
  private readonly condValue: BooleanFunction | null;

  /** @java To.type — the graph element type. */
  private readonly typeValue: SiteType1to1 | null;

  /** @java To.rotations — rotations of the to location. */
  private readonly rotationsValue: RotationsLike | null;

  /** @java To.effect — the effect to apply on the to locations. */
  private readonly effectValue: Apply | null;

  /**
   * @java game/util/moves/To.java — constructor
   *
   * Java default: if region == null and loc == null, defaults to iterator To
   * (reads context._evalTo). We store null for both in that case.
   */
  public constructor(
    type: SiteType1to1 | { loc?: IntFunction | null; region?: RegionFunction | null; level?: IntFunction | null; cond?: BooleanFunction | null; type?: SiteType1to1 | null; rotations?: RotationsLike | null; effect?: Apply | null } | null,
    region?: RegionFunction | null,
    loc?: IntFunction | null,
    level?: IntFunction | null,
    rotations?: RotationsLike | null,
    If?: BooleanFunction | null,
    effect?: Apply | null
  ) {
    if (typeof type === "object" && type !== null) {
      this.locValue = type.region != null ? null : (type.loc ?? { eval: (ctx) => ctx._evalTo });
      this.regionValue = type.region ?? null;
      this.levelValue = type.level ?? null;
      this.condValue = type.cond ?? null;
      this.rotationsValue = type.rotations ?? null;
      this.typeValue = type.type ?? null;
      this.effectValue = type.effect ?? null;
      return;
    }
    this.locValue = region != null ? null : (loc ?? { eval: (ctx) => ctx._evalTo });
    this.regionValue = region ?? null;
    this.levelValue = level ?? null;
    this.condValue = If ?? null;
    this.rotationsValue = rotations ?? null;
    this.typeValue = type ?? null;
    this.effectValue = effect ?? null;
  }

  /** @java To.loc() */
  public locFn(): IntFunction | null {
    return this.locValue;
  }

  /** @java To.loc() */
  public loc(): IntFunction | null {
    return this.locValue;
  }

  /** @java To.region() */
  public regionFn(): RegionFunction | null {
    return this.regionValue;
  }

  /** @java To.region() */
  public region(): RegionFunction | null {
    return this.regionValue;
  }

  /** @java To.level() */
  public levelFn(): IntFunction | null {
    return this.levelValue;
  }

  /** @java To.level() */
  public level(): IntFunction | null {
    return this.levelValue;
  }

  /** @java To.cond() */
  public condFn(): BooleanFunction | null {
    return this.condValue;
  }

  /** @java To.cond() */
  public cond(): BooleanFunction | null {
    return this.condValue;
  }

  /** @java To.type() */
  public siteType(): SiteType1to1 | null {
    return this.typeValue;
  }

  /** @java To.type() */
  public type(): SiteType1to1 | null {
    return this.typeValue;
  }

  /** @java To.effect() */
  public effectFn(): Apply | null {
    return this.effectValue;
  }

  /** @java To.rotations() */
  public rotations(): RotationsLike | null {
    return this.rotationsValue;
  }

  /** @java To.effect() */
  public effect(): Apply | null {
    return this.effectValue;
  }
}

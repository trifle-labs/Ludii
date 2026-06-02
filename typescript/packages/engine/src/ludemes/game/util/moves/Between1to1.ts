/**
 * Between1to1.ts
 * @java game/util/moves/Between.java
 *
 * Parameter holder for the ``between'' clause of hop/step moves.
 * Holds the condition applied between the from and to sites,
 * the optional trail piece, the before/range/after distances,
 * and the optional effect to apply.
 *
 * This is a data class — no eval(ctx). Move generators (Hop, etc.) read it.
 */

import type { BooleanFunction, IntFunction, RegionFunction } from "../../../base.js";

/**
 * Gets all the conditions or effects related to the location between
 * ``from'' and ``to''.
 * @java game/util/moves/Between.java
 */
export class Between1to1 {
  /** @java Between.trail — the piece to let between the from and to. */
  private readonly trail: IntFunction | null;

  /** @java Between.cond — the condition applied between the from and to. */
  private readonly cond: BooleanFunction | null;

  /** @java Between.before — the distance before the range locations. */
  private readonly before: IntFunction | null;

  /** @java Between.range — the range of the middle locations. */
  private readonly range: [IntFunction, IntFunction] | null;

  /** @java Between.after — the distance after the range locations. */
  private readonly after: IntFunction | null;

  /** @java Between.effect — the effect to apply on the locations. */
  private readonly effect: (() => void) | null;

  /**
   * @java game/util/moves/Between.java — constructor
   */
  public constructor(opts: {
    trail?: IntFunction | null;
    cond?: BooleanFunction | null;
    before?: IntFunction | null;
    range?: [IntFunction, IntFunction] | null;
    after?: IntFunction | null;
    effect?: (() => void) | null;
  }) {
    this.trail = opts.trail ?? null;
    this.cond = opts.cond ?? null;
    this.before = opts.before ?? null;
    this.range = opts.range ?? null;
    this.after = opts.after ?? null;
    this.effect = opts.effect ?? null;
  }

  /** @java Between.trail() */
  public trailFn(): IntFunction | null {
    return this.trail;
  }

  /** @java Between.condition() */
  public condition(): BooleanFunction | null {
    return this.cond;
  }

  /** @java Between.before() */
  public beforeFn(): IntFunction | null {
    return this.before;
  }

  /** @java Between.range() */
  public rangeFn(): [IntFunction, IntFunction] | null {
    return this.range;
  }

  /** @java Between.after() */
  public afterFn(): IntFunction | null {
    return this.after;
  }

  /** @java Between.effect() */
  public effectFn(): (() => void) | null {
    return this.effect;
  }
}

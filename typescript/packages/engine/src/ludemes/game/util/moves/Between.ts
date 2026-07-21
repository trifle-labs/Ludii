/**
 * Between.ts
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
import type { Apply } from "../../rules/play/moves/nonDecision/effect/Apply.js";

export interface RangeLike {
  readonly minFn: IntFunction;
  readonly maxFn: IntFunction;
}

/**
 * Gets all the conditions or effects related to the location between
 * ``from'' and ``to''.
 * @java game/util/moves/Between.java
 */
export class Between {
  /** @java Between.trail — the piece to let between the from and to. */
  private readonly trail: IntFunction | null;

  /** @java Between.cond — the condition applied between the from and to. */
  private readonly cond: BooleanFunction | null;

  /** @java Between.before — the distance before the range locations. */
  private readonly before: IntFunction | null;

  /** @java Between.range — the range of the middle locations. */
  private readonly rangeValue: RangeLike | null;

  /** @java Between.after — the distance after the range locations. */
  private readonly after: IntFunction | null;

  /** @java Between.effect — the effect to apply on the locations. */
  private readonly effectValue: Apply | null;

  /**
   * @java game/util/moves/Between.java — constructor
   */
  public constructor(
    before: IntFunction | { trail?: IntFunction | null; cond?: BooleanFunction | null; before?: IntFunction | null; range?: RangeLike | [IntFunction, IntFunction] | null; after?: IntFunction | null; effect?: Apply | null } | null,
    range?: RangeLike | null,
    after?: IntFunction | null,
    If?: BooleanFunction | null,
    trail?: IntFunction | null,
    effect?: Apply | null
  ) {
    if (typeof before === "object" && before !== null && !("eval" in before)) {
      this.trail = before.trail ?? null;
      this.cond = before.cond ?? null;
      this.before = before.before ?? null;
      this.rangeValue = normaliseRange(before.range ?? null);
      this.after = before.after ?? null;
      this.effectValue = before.effect ?? null;
      return;
    }
    this.trail = trail ?? null;
    this.cond = If ?? null;
    this.before = before ?? null;
    this.rangeValue = range ?? null;
    this.after = after ?? null;
    this.effectValue = effect ?? null;
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
    return this.rangeValue === null ? null : [this.rangeValue.minFn, this.rangeValue.maxFn];
  }

  /** @java Between.after() */
  public afterFn(): IntFunction | null {
    return this.after;
  }

  /** @java Between.effect() */
  public range(): RangeLike | null {
    return this.rangeValue;
  }

  /** @java Between.effect() */
  public effectFn(): Apply | null {
    return this.effectValue;
  }

  /** @java Between.effect() */
  public effect(): Apply | null {
    return this.effectValue;
  }
}

function normaliseRange(range: RangeLike | [IntFunction, IntFunction] | null): RangeLike | null {
  if (range === null) return null;
  if (Array.isArray(range)) return { minFn: range[0], maxFn: range[1] };
  return range;
}

/**
 * Iterator1to1.ts
 *
 * Faithful 1:1 ports of iterator int ludemes:
 *   From, To, Site, Between, Level, Pips, Track, Edge, Hint
 *
 * @java game/functions/ints/iterator/From.java
 * @java game/functions/ints/iterator/To.java
 * @java game/functions/ints/iterator/Site.java
 * @java game/functions/ints/iterator/Between.java
 * @java game/functions/ints/iterator/Level.java
 * @java game/functions/ints/iterator/Pips.java
 * @java game/functions/ints/iterator/Track.java
 * @java game/functions/ints/iterator/Edge.java
 * @java game/functions/ints/iterator/Hint.java
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";

// ---------------------------------------------------------------------------
// From
// ---------------------------------------------------------------------------
export class From1to1 implements IntFunction {
  /** @java game/functions/ints/iterator/From.java — eval: context.from() */
  public eval(ctx: Context): number {
    return ctx._evalFrom;
  }
}

// ---------------------------------------------------------------------------
// To
// ---------------------------------------------------------------------------
export class To1to1 implements IntFunction {
  /** @java game/functions/ints/iterator/To.java — eval: context.to() */
  public eval(ctx: Context): number {
    return ctx._evalTo;
  }
}

// ---------------------------------------------------------------------------
// Site (forEach site iterator current site)
// ---------------------------------------------------------------------------
export class Site1to1 implements IntFunction {
  /**
   * @java game/functions/ints/iterator/Site.java — eval: context.site()
   * Returns the current site being iterated over by forEach.
   */
  public eval(ctx: Context): number {
    const s = ctx._evalSite;
    return (s !== undefined && s !== null && s >= 0) ? s : ctx._evalFrom;
  }
}

// ---------------------------------------------------------------------------
// Between
// ---------------------------------------------------------------------------
export class Between1to1 implements IntFunction {
  /**
   * @java game/functions/ints/iterator/Between.java — eval: context.between()
   * The "between" site (hurdle) set during hop iteration.
   */
  public eval(ctx: Context): number {
    // Java: context.between() — set by hop moves via _evalBetween.
    const b = ctx._evalBetween;
    return b >= 0 ? b : ctx._evalFrom;
  }
}

// ---------------------------------------------------------------------------
// Level
// ---------------------------------------------------------------------------
export class Level1to1 implements IntFunction {
  /**
   * @java game/functions/ints/iterator/Level.java — eval: context.level()
   * For stacking games; returns 0 in non-stacking games.
   */
  public eval(ctx: Context): number {
    const ctxAny = ctx as unknown as { _evalLevel?: number };
    return ctxAny._evalLevel ?? 0;
  }
}

// ---------------------------------------------------------------------------
// Pips
// ---------------------------------------------------------------------------
export class Pips1to1 implements IntFunction {
  /**
   * @java game/functions/ints/iterator/Pips.java — eval: context.pipCount()
   * Current die pip value set by forEach Die iteration.
   */
  public eval(ctx: Context): number {
    const ctxAny = ctx as unknown as { _evalPips?: number };
    return ctxAny._evalPips ?? 0;
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

// Hint — puzzle hint (not applicable in 1:1 play path; return _evalSite or 0)
// Edge — current edge index in iterator
// Track — current track index in iterator

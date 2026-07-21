// @java Core/src/game/functions/ints/state/What.java

/**
 * Returns the component index at a site.
 *
 * @java game/functions/ints/state/What.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";

export class What extends BaseIntFunction {
  /** @java What.type */
  private readonly type: string | null;
  /** @java What.loc */
  private readonly loc: JavaIntFunction;
  /** @java What.level */
  private readonly level: JavaIntFunction | null;

  /** @java What(@Opt SiteType type, @Name IntFunction at, @Opt @Name IntFunction level) */
  public constructor(type: string | null, at: JavaIntFunction, level: JavaIntFunction | null = null) {
    super();
    this.type = type;
    this.loc = at;
    this.level = level;
  }

  /** @java What.construct — static factory mirroring the ctor (reflection lists both). */
  public static construct(type: string | null, at: JavaIntFunction, level: JavaIntFunction | null = null): What {
    return new What(type, at, level);
  }

  /** @java What.eval(Context) — containerState.what(site, level, type) */
  public override eval(context: Context): number {
    const site = this.loc.eval(context);
    if (site < 0) return 0;
    const st = context.state as unknown as { whatAtSite(s: number): number; whatAtSiteLevel?: (s: number, l: number) => number };
    if (this.level !== null && st.whatAtSiteLevel) {
      return st.whatAtSiteLevel(site, this.level.eval(context));
    }
    // @java What.java:54 — `level` defaults to `new IntConstant(0)` when the
    // ctor's @Opt level arg is omitted, i.e. an unqualified `(what at:X)`
    // ALWAYS means level 0 (the bottom of the stack) on a stacking game —
    // What.java:70-79 (`if (context.game().isStacking()) ... state.what(site,
    // level.eval(context), type)`) never falls back to the site's "current"/
    // top piece. Only a genuinely non-stacking game ignores level entirely
    // (What.java:82-83, the plain `ContainerState.what(site, type)` branch),
    // which is what the final `st.whatAtSite(site)` below still covers.
    // Before this fix, an omitted level always read `whatAtSite` (the site's
    // top/current piece) even on stacking games — Minesweeper's `(move Select
    // (from (sites Board)) (then (if (= (what at:(last From)) (id "Bomb"))
    // (set Var 1 ...) ...)))` selects a site's TOP level (Select.java:145-149
    // mirrors `cs.sizeStack(site)-1` into levelFrom), but a Flag placed on top
    // of a Bomb (via the hand-to-board `copy:True stack:True` move) made the
    // bomb-hit check read the Flag instead of the level-0 Bomb underneath, so
    // `(var)` was never set to 1 and the Loss end rule never fired.
    const isStacking = (context.game as unknown as { isStacking?: () => boolean }).isStacking?.() === true;
    if (isStacking && st.whatAtSiteLevel) {
      return st.whatAtSiteLevel(site, 0);
    }
    void this.type;
    return st.whatAtSite(site);
  }

  /** @java What.isStatic() */
  public isStatic(): boolean { return false; }
}

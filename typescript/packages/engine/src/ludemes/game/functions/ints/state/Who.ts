// @java Core/src/game/functions/ints/state/Who.java

/**
 * Returns the owner of the piece at a site.
 *
 * @java game/functions/ints/state/Who.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";

export class Who extends BaseIntFunction {
  /** @java Who.type */
  private readonly type: string | null;
  /** @java Who.loc */
  private readonly loc: JavaIntFunction;
  /** @java Who.level */
  private readonly level: JavaIntFunction | null;

  /** @java Who(@Opt SiteType type, @Name IntFunction at, @Opt @Name IntFunction level) */
  public constructor(type: string | null, at: JavaIntFunction, level: JavaIntFunction | null = null) {
    super();
    this.type = type;
    this.loc = at;
    this.level = level;
  }

  /** @java Who.construct — static factory mirroring the ctor (reflection lists both). */
  public static construct(type: string | null, at: JavaIntFunction, level: JavaIntFunction | null = null): Who {
    return new Who(type, at, level);
  }

  /** @java Who.eval(Context) — containerState.who(site, type, level) */
  public override eval(context: Context): number {
    const site = this.loc.eval(context);
    if (site < 0) return 0;
    // @java cs.who(site, type): an explicit, genuinely non-default `type`
    // (e.g. `(who Cell at:(to))` on a use:Vertex board) dispatches to that
    // type's OWN typed channel, not the flat default-type substrate — mirrors
    // SitesIncident.whoOf()'s identical fix (LastEdge/BlockWin). Falling back
    // to the flat `cells[site]` conflated a typed-channel index with a
    // same-numbered default-type site's occupancy, so `(is Enemy (who Cell
    // at:(to)))` read the wrong owner whenever the two channels' numbering
    // happened to disagree at that index (Triple Tangle: Cell 8 owned by
    // enemy P2, flat Vertex 8 owned by mover P1 — the capture candidate was
    // silently dropped).
    if (this.type !== null) {
      const st = context.state as unknown as {
        whoTyped?(t: string, s: number): number;
        typedSites?: ReadonlyMap<string, unknown>;
      };
      if (st.typedSites?.has(this.type)) {
        return st.whoTyped?.(this.type, site) ?? 0;
      }
    }
    // @java cs.who(site, level): a level-qualified (who at:site level:L) reads
    // the owner at THAT stack level, not the top. The old code returned cells[]
    // (the top owner), so largeStack mancala's ball-detection
    //   (= (who at:(last From) level:(- (size Stack) value)) P1)
    // always saw the top piece (Laomuzhu mis-routed ball captures).
    if (this.level !== null) {
      const lv = this.level.eval(context);
      const st = context.state as unknown as { whoAtSiteLevel?: (s: number, l: number) => number };
      if (typeof st.whoAtSiteLevel === "function") return st.whoAtSiteLevel(site, lv);
    }
    return (context.state as unknown as { cells: readonly number[] }).cells[site] ?? 0;
  }

  /** @java Who.isStatic() */
  public isStatic(): boolean { return false; }
}

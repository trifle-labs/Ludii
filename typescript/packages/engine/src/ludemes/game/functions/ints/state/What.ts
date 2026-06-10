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

  /** @java What.eval(Context) — containerState.what(site, level, type) */
  public override eval(context: Context): number {
    const site = this.loc.eval(context);
    if (site < 0) return 0;
    const st = context.state as unknown as { whatAtSite(s: number): number; whatAtSiteLevel?: (s: number, l: number) => number };
    if (this.level !== null && st.whatAtSiteLevel) {
      return st.whatAtSiteLevel(site, this.level.eval(context));
    }
    void this.type;
    return st.whatAtSite(site);
  }

  /** @java What.isStatic() */
  public isStatic(): boolean { return false; }
}

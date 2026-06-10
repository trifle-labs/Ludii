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

  /** @java Who.eval(Context) — containerState.who(site, type) */
  public override eval(context: Context): number {
    const site = this.loc.eval(context);
    if (site < 0) return 0;
    void this.type; void this.level; // engine substrate is flat until State convergence
    return (context.state as unknown as { cells: readonly number[] }).cells[site] ?? 0;
  }

  /** @java Who.isStatic() */
  public isStatic(): boolean { return false; }
}

// @java Core/src/game/functions/ints/state/State.java

/**
 * Returns the local state value of a site.
 *
 * @java game/functions/ints/state/State.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";
import { isNonDefaultTyped } from "../../region/sites/index/SitesEmpty.js";

export class State extends BaseIntFunction {
  /** @java State.type */
  private readonly type: string | null;
  /** @java State.loc */
  private readonly loc: JavaIntFunction;
  /** @java State.level */
  private readonly level: JavaIntFunction | null;

  /** @java State(@Opt SiteType type, @Name IntFunction at, @Opt @Name IntFunction level) */
  public constructor(type: string | null, at: JavaIntFunction, level: JavaIntFunction | null = null) {
    super();
    this.type = type;
    this.loc = at;
    this.level = level;
  }

  /** @java State.construct — static factory mirroring the ctor (reflection lists both). */
  public static construct(type: string | null, at: JavaIntFunction, level: JavaIntFunction | null = null): State {
    return new State(type, at, level);
  }

  /** @java State.eval(Context) — containerState.state(site, level, type) */
  public override eval(context: Context): number {
    const site = this.loc.eval(context);
    if (site < 0) return 0;
    // @java State.java — level = (level == null) ? UNDEFINED : level.eval(context),
    // then cs.state(site, level, type): ContainerStateStacks reads the state
    // channel AT that level. Discarding the level made (state at:s level:L)
    // return the flat scalar for every level — Aj Sakakil's buried
    // CapturedPiece (state=2 at level 0) read as 0 and stayed mobile.
    const levelVal = this.level !== null ? this.level.eval(context) : -1;
    // Non-default graph element (e.g. Edge on a Cell-default board): state lives
    // in the typed channel, not the flat cell-sized stateAt[].
    if (isNonDefaultTyped(context, this.type)) {
      return (context.state as unknown as {
        stateTyped(type: string, site: number): number;
      }).stateTyped(this.type as string, site);
    }
    if (levelVal >= 0) {
      return (context.state as unknown as {
        stateAtLevel(site: number, level: number): number;
      }).stateAtLevel(site, levelVal);
    }
    return (context.state as unknown as { stateAt: readonly number[] }).stateAt[site] ?? 0;
  }

  /** @java State.isStatic() */
  public isStatic(): boolean { return false; }
}

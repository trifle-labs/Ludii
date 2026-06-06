// @java Core/src/game/functions/booleans/is/Hidden/IsHiddenState.java

import type { Context } from "../../../../../../context.js";
import { BaseBooleanFunction } from "../../BaseBooleanFunction.js";
import type { IntFunction } from "../../../../../base.js";
import type { SiteType } from "../../../../../other/action/SiteType.js";

/**
 * Checks if the site state is hidden to a player.
 *
 * @java game/functions/booleans/is/Hidden/IsHiddenState.java
 * @author Eric.Piette
 */
export class IsHiddenState extends BaseBooleanFunction {
  /** @java IsHiddenState.siteFn */
  private readonly siteFn: IntFunction;
  /** @java IsHiddenState.levelFn */
  private readonly levelFn: IntFunction;
  /** @java IsHiddenState.whoFn */
  private readonly whoFn: IntFunction;
  /** @java IsHiddenState.type */
  private readonly type: SiteType | null;
  /** @java IsHiddenState.precomputedBoolean */
  private precomputedBoolean: boolean | null = null;

  /**
   * For checking the hidden information about the state at a location for a
   * specific player.
   *
   * @param type    The graph element type [default of the board].
   * @param siteFn  The site function.
   * @param levelFn The level function (defaults to 0).
   * @param whoFn   The player-index function.
   * @java IsHiddenState(SiteType, IntFunction, IntFunction, Player, RoleType)
   */
  public constructor(
    type: SiteType | null,
    siteFn: IntFunction,
    levelFn: IntFunction,
    whoFn: IntFunction,
  ) {
    super();
    this.type = type;
    this.siteFn = siteFn;
    this.levelFn = levelFn;
    this.whoFn = whoFn;
  }

  /**
   * @java IsHiddenState.eval(Context)
   */
  public override eval(context: Context): boolean {
    if (this.precomputedBoolean !== null) {
      return this.precomputedBoolean;
    }

    const site = this.siteFn.eval(context);

    if (site < 0) {
      return false;
    }

    // Java: context.containerId()[site]
    const ctxAny = context as unknown as {
      containerId?(): number[];
      state?(): {
        containerStates?(): Array<{
          isHiddenState(who: number, site: number, level: number, type: SiteType): boolean;
        }>;
      };
    };

    const containerIdFn = ctxAny.containerId;
    const containerId = typeof containerIdFn === "function"
      ? containerIdFn.call(context)[site] ?? 0
      : 0;

    // Java: context.state().containerStates()[containerId]
    const stateFn = ctxAny.state;
    const stateObj = typeof stateFn === "function" ? stateFn.call(context) : null;
    const containerStates = stateObj?.containerStates?.();
    const cs = containerStates?.[containerId];

    const level = this.levelFn.eval(context);

    // Java: (type != null) ? type : context.game().board().defaultSite()
    const gameAny = context.game as unknown as {
      board?(): { defaultSite?(): SiteType };
    };
    const realType: SiteType =
      this.type !== null
        ? this.type
        : (gameAny.board?.()?.defaultSite?.() ?? "Cell");

    const who = this.whoFn.eval(context);

    if (cs !== undefined && cs !== null) {
      return cs.isHiddenState(who, site, level, realType);
    }

    // Fallback: use state.isHidden if the container state system is unavailable.
    return context.state.isHidden(who, site);
  }

  /** @java IsHiddenState.isStatic() */
  public override isStatic(): boolean {
    const siteStatic = (this.siteFn as unknown as { isStatic?(): boolean }).isStatic?.() === true;
    const levelStatic = (this.levelFn as unknown as { isStatic?(): boolean }).isStatic?.() === true;
    const whoStatic = (this.whoFn as unknown as { isStatic?(): boolean }).isStatic?.() === true;
    return siteStatic && levelStatic && whoStatic;
  }
}

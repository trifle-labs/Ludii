// @java Core/src/game/functions/booleans/is/Hidden/IsHiddenRotation.java

import type { Context } from "../../../../../../context.js";
import { BaseBooleanFunction } from "../../BaseBooleanFunction.js";
import type { IntFunction } from "../../../../../base.js";
import type { SiteType } from "../../../../../other/action/SiteType.js";

/**
 * Checks if the rotation on a site is hidden to a player.
 *
 * @java game/functions/booleans/is/Hidden/IsHiddenRotation.java
 * @author Eric.Piette
 */
export class IsHiddenRotation extends BaseBooleanFunction {
  /** @java IsHiddenRotation.siteFn */
  private readonly siteFn: IntFunction;
  /** @java IsHiddenRotation.levelFn */
  private readonly levelFn: IntFunction;
  /** @java IsHiddenRotation.whoFn */
  private readonly whoFn: IntFunction;
  /** @java IsHiddenRotation.type */
  private readonly type: SiteType | null;
  /** @java IsHiddenRotation.precomputedBoolean */
  private precomputedBoolean: boolean | null = null;

  /**
   * For checking the hidden information about the rotation at a location for a
   * specific player.
   *
   * @param type    The graph element type [default of the board].
   * @param siteFn  The site function.
   * @param levelFn The level function (defaults to 0).
   * @param whoFn   The player-index function.
   * @java IsHiddenRotation(SiteType, IntFunction, IntFunction, Player, RoleType)
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
   * @java IsHiddenRotation.eval(Context)
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
          isHiddenRotation(who: number, site: number, level: number, type: SiteType): boolean;
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
      return cs.isHiddenRotation(who, site, level, realType);
    }

    // Fallback: use state.isHidden if the container state system is unavailable.
    return context.state.isHidden(who, site);
  }

  /** @java IsHiddenRotation.isStatic() */
  public override isStatic(): boolean {
    const siteStatic = (this.siteFn as unknown as { isStatic?(): boolean }).isStatic?.() === true;
    const levelStatic = (this.levelFn as unknown as { isStatic?(): boolean }).isStatic?.() === true;
    const whoStatic = (this.whoFn as unknown as { isStatic?(): boolean }).isStatic?.() === true;
    return siteStatic && levelStatic && whoStatic;
  }
}

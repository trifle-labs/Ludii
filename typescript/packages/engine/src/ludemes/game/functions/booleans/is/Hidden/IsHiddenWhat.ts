// @java Core/src/game/functions/booleans/is/Hidden/IsHiddenWhat.java

import type { Context } from "../../../../../../context.js";
import { BaseBooleanFunction } from "../../BaseBooleanFunction.js";
import type { IntFunction } from "../../../../../base.js";
import type { SiteType } from "../../../../../other/action/SiteType.js";
import { IntConstant } from "../../../ints/IntConstant.js";
import { roleTypeOwner, type RoleTypeFull } from "../../../../types/play/RoleType.js";
import type { Player1to1 } from "../../../../util/moves/Player1to1.js";

/**
 * Checks if the piece index is hidden to a player.
 *
 * @java game/functions/booleans/is/Hidden/IsHiddenWhat.java
 * @author Eric.Piette
 *
 * Note: in the Java source, IsHiddenWhat uses `new Id(null, To)` to resolve
 * the who-function when a RoleType is given.
 */
export class IsHiddenWhat extends BaseBooleanFunction {
  /** @java IsHiddenWhat.siteFn */
  private readonly siteFn: IntFunction;
  /** @java IsHiddenWhat.levelFn */
  private readonly levelFn: IntFunction;
  /** @java IsHiddenWhat.whoFn */
  private readonly whoFn: IntFunction | null;
  /** @java IsHiddenWhat.type */
  private readonly type: SiteType | null;
  /** @java IsHiddenWhat.precomputedBoolean */
  private precomputedBoolean: boolean | null = null;

  /**
   * For checking the hidden information about the piece index at a location for
   * a specific player.
   *
   * @param type  The graph element type [default of the board].
   * @param at    The site to set the hidden information.
   * @param level The level to set the hidden information [0].
   * @param to    The player with these hidden information.
   * @param To    The roleType with these hidden information.
   * @java IsHiddenWhat(SiteType, IntFunction, IntFunction, Player, RoleType)
   */
  public constructor(
    type: SiteType | null,
    at: IntFunction,
    level: IntFunction | null,
    to: Player1to1 | null,
    To: RoleTypeFull | null,
  ) {
    super();
    this.type = type;
    this.siteFn = at;
    this.levelFn = level === null ? new IntConstant(0) : level;
    this.whoFn = to === null && To === null
      ? null
      : To !== null
        ? roleTypeToIntFunction(To)
        : playerOriginalIndex(to);
  }

  /**
   * @java IsHiddenWhat.eval(Context)
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
          isHiddenWhat(who: number, site: number, level: number, type: SiteType): boolean;
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

    const who = this.whoFn!.eval(context);

    if (cs !== undefined && cs !== null) {
      return cs.isHiddenWhat(who, site, level, realType);
    }

    // Fallback: use state.isHidden if the container state system is unavailable.
    return context.state.isHidden(who, site);
  }

  /** @java IsHiddenWhat.isStatic() */
  public override isStatic(): boolean {
    const siteStatic = (this.siteFn as unknown as { isStatic?(): boolean }).isStatic?.() === true;
    const levelStatic = (this.levelFn as unknown as { isStatic?(): boolean }).isStatic?.() === true;
    const whoStatic = (this.whoFn! as unknown as { isStatic?(): boolean }).isStatic?.() === true;
    return siteStatic && levelStatic && whoStatic;
  }
}

function playerOriginalIndex(player: Player1to1 | null): IntFunction | null {
  if (player === null) {
    return null;
  }

  const playerLike = player as unknown as {
    original?: () => IntFunction | null;
    originalIndex?: () => IntFunction | null;
  };

  if (typeof playerLike.original === "function") {
    return playerLike.original();
  }
  if (typeof playerLike.originalIndex === "function") {
    return playerLike.originalIndex();
  }

  return null;
}

function roleTypeToIntFunction(role: RoleTypeFull): IntFunction {
  const owner = roleTypeOwner(role);
  if (owner > 0) {
    return new IntConstant(owner);
  }

  switch (role) {
    case "Neutral":
      return new IntConstant(0);
    case "Shared":
    case "All":
    case "Each":
      return { eval: (context: Context): number => context.numPlayers() + 1 };
    case "Mover":
      return { eval: (context: Context): number => context.state.mover };
    case "Next":
      return {
        eval: (context: Context): number => {
          const next = (context.state as unknown as { next?: number }).next;
          return next !== undefined && next > 0 ? next : (context.state.mover % context.numPlayers()) + 1;
        },
      };
    case "Prev":
      return { eval: (context: Context): number => Math.max(1, context.state.mover - 1) };
    case "Player":
      return {
        eval: (context: Context): number =>
          (context as unknown as { _evalPlayer?: number })._evalPlayer ?? -1,
      };
    case "TeamMover":
      return {
        eval: (context: Context): number => {
          const stateWithTeams = context.state as unknown as { getTeam?: (player: number) => number };
          return stateWithTeams.getTeam?.(context.state.mover) ?? -1;
        },
      };
    default:
      return new IntConstant(-1);
  }
}

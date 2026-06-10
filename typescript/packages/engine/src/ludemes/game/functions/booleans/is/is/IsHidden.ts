// @java Core/src/game/functions/booleans/is/Hidden/IsHidden.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { SiteType } from "../../../../../other/action/SiteType.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";
import { IntConstant } from "../../../ints/IntConstant.js";
import { roleTypeOwner, type RoleTypeFull } from "../../../../types/play/RoleType.js";
import { Player1to1 } from "../../../../util/moves/Player1to1.js";

/**
 * (is Hidden [<SiteType>] at:<site> [level:<int>] to:<player>)
 * Checks if a site is hidden (invisible) to a player.
 * @java game/functions/booleans/is/Hidden/IsHidden.java
 */
export class IsHidden implements BooleanFunction {
  /** @java IsHidden.siteFn */
  private readonly siteFn: IntFunction;
  /** @java IsHidden.levelFn */
  private readonly levelFn: IntFunction;
  /** @java IsHidden.whoFn */
  private readonly whoFn: IntFunction | null;
  /** @java IsHidden.type */
  private readonly type: SiteType | null;

  public constructor(
    type: SiteType | null,
    at: IntFunction,
    level: IntFunction | null,
    to: Player1to1 | null,
    To: RoleTypeFull | null,
  );
  public constructor(siteFn: IntFunction, whoFn: IntFunction);
  public constructor(
    type: SiteType | IntFunction | null,
    at: IntFunction,
    level?: IntFunction | null,
    to?: Player1to1 | null,
    To?: RoleTypeFull | null,
  ) {
    if (isIntFunction(type) && level === undefined && to === undefined && To === undefined) {
      this.type = null;
      this.siteFn = type;
      this.levelFn = new IntConstant(0);
      this.whoFn = at;
      return;
    }

    this.type = type as SiteType | null;
    this.siteFn = at;
    this.levelFn = level === null || level === undefined ? new IntConstant(0) : level;
    this.whoFn = (to === null || to === undefined) && (To === null || To === undefined)
      ? null
      : To !== null && To !== undefined
        ? roleTypeToIntFunction(To)
        : playerOriginalIndex(to ?? null);
  }

  /**
   * @java IsHidden.eval(Context):
   *   site = siteFn.eval; if (site<0) false;
   *   who = whoFn.eval; return cs.isHidden(who, site, level, type)
   * TS: state.isHidden(who, site)
   */
  public eval(ctx: Context): boolean {
    const site = this.siteFn.eval(ctx);
    if (site < 0) return false;
    const who = this.whoFn!.eval(ctx);
    return ctx.state.isHidden(who, site);
  }
}

function resolvePlayerFn(positional: LudNode[]): IntFunction {
  // Find the "to:" named arg or last positional role
  for (const p of positional) {
    if (isIdent(p)) {
      const name = p.name.toLowerCase();
      if (name === "mover") return { eval(ctx: Context): number { return ctx.state.mover; } };
      if (name === "next") return { eval(ctx: Context): number { return (ctx.state.mover % ctx.game.numPlayers) + 1; } };
      if (name.startsWith("p") && !isNaN(parseInt(name.slice(1), 10))) {
        const pid = parseInt(name.slice(1), 10);
        return { eval(_ctx: Context): number { return pid; } };
      }
    }
  }
  return { eval(ctx: Context): number { return ctx.state.mover; } };
}

// Variant keys for the hidden sub-types: all check the same isHidden(who, site) on the TS side
// because TS State only exposes one hidden array (per player per site, no sub-fields).
// Java tracks hidden sub-fields (count, rotation, state, value, what, who) but TS collapses them.


function isIntFunction(value: unknown): value is IntFunction {
  return typeof (value as { eval?: unknown } | null)?.eval === "function";
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

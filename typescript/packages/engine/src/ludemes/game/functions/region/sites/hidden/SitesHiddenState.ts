// @java Core/src/game/functions/region/sites/hidden/SitesHiddenState.java

/**
 * Returns all the sites whose site state is hidden to a player on the board.
 *
 * @java game/functions/region/sites/hidden/SitesHiddenState.java
 *
 * Java parity: iterates topology elements, calls
 * ContainerState.isHiddenState(pid, site, 0, realType) and collects matches.
 *
 * TS parity: delegates to state.isHidden(who, site) — the single hidden flag.
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, IntFunction } from "../../../../../base.js";
import type { Player } from "../../../../util/moves/Player.js";
import type { RoleTypeFull } from "../../../../types/play/RoleType.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

type RoleTypeName = RoleTypeFull | string;
type PlayerArgument = Player | IntFunction | number | {
  original?: () => IntFunction | null;
  originalIndex?: () => IntFunction | null;
  index?: () => IntFunction | number;
};

/**
 * @java game.functions.region.sites.hidden.SitesHiddenState
 */
export class SitesHiddenState extends BaseRegionFunction {
  /** @java SitesHiddenState — private final IntFunction whoFn */
  private readonly whoFn: IntFunction | null;

  /** @java SitesHiddenState — private final RoleType roleType */
  private readonly roleType: RoleTypeName | null;

  /**
   * @java SitesHiddenState(SiteType, Player, RoleType)
   * @param type Graph element type [default of the board].
   * @param to   The player with these hidden information.
   * @param To   The roleType with these hidden information.
   */
  public constructor(
    type: string | null | undefined,
    to: PlayerArgument | null | undefined,
    To: RoleTypeName | null | undefined,
  ) {
    super();
    this.siteType = type ?? null;
    this.whoFn = to == null && To == null
      ? null
      : To != null
        ? roleTypeToIntFunction(To)
        : playerToOriginalIndex(to);
    this.roleType = To ?? null;
  }

  /**
   * @java SitesHiddenState.eval(Context)
   * Returns sites where the site state is hidden to the specified player.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const who = this.whoFn!.eval(ctx);
    const sites: number[] = [];
    const n = ctx.state.cells.length;
    for (let i = 0; i < n; i++) {
      // @java ContainerState.isHiddenState(who, i, 0, realType)
      if (ctx.state.isHidden(who, i)) sites.push(i);
    }
    return sites;
  }
}

function playerToOriginalIndex(player: PlayerArgument | null | undefined): IntFunction | null {
  if (player == null) return null;
  if (typeof player === "number") return constInt(player);

  const playerLike = player as {
    eval?: (ctx: Context & EvalScratch) => number;
    original?: () => IntFunction | null;
    originalIndex?: () => IntFunction | null;
    index?: () => IntFunction | number;
  };

  if (typeof playerLike.original === "function") return playerLike.original() ?? null;
  if (typeof playerLike.originalIndex === "function") return playerLike.originalIndex() ?? null;
  if (typeof playerLike.eval === "function") return player as IntFunction;
  if (typeof playerLike.index === "function") {
    const index = playerLike.index();
    return typeof index === "number" ? constInt(index) : index;
  }

  return null;
}

function roleTypeToIntFunction(role: RoleTypeName): IntFunction {
  const match = /^P(\d+)$/.exec(role);
  if (match !== null) return constInt(Number(match[1]));
  if (role === "Neutral" || role === "Shared") return constInt(0);
  if (role === "Mover") return { eval: (ctx) => ctx.state.mover };
  if (role === "Next") {
    return { eval: (ctx) => (ctx.state as unknown as { next?: number }).next ?? ctx.state.mover };
  }
  if (role === "Prev") {
    return { eval: (ctx) => (ctx.state as unknown as { prev?: number }).prev ?? ctx.state.mover };
  }
  return constInt(-1);
}

function constInt(value: number): IntFunction {
  return { eval: () => value };
}

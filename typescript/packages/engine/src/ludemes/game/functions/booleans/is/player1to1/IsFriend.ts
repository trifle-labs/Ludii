// @java Core/src/game/functions/booleans/is/player/IsFriend.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { RoleTypeFull } from "../../../../types/play/RoleType.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";

/**
 * (is Friend <who>) / (is Friendly <who>)
 * Checks if the given player is a friend of the mover (same team or is the mover).
 * Non-teams parity: friend iff player == mover (or mover is omniscient player).
 * @java game/functions/booleans/is/player/IsFriend.java
 */
export class IsFriend implements BooleanFunction {
  /** @java IsFriend.playerId */
  private readonly playerId: IntFunction;

  /**
   * @java IsFriend(@Or IntFunction indexPlayer, @Or RoleType role)
   */
  public constructor(indexPlayer: IntFunction | null, role: RoleTypeFull | null) {
    const numNonNull = (indexPlayer != null ? 1 : 0) + (role != null ? 1 : 0);
    if (numNonNull !== 1) {
      throw new Error("IsFriend(): exactly one Or parameter must be non-null.");
    }

    this.playerId = indexPlayer ?? roleToIntFunction(role!);
  }

  /**
   * @java game/functions/booleans/is/player/IsFriend.java — eval(Context):
   *   Non-teams: playerId.eval == mover || mover == players.size()
   */
  public eval(ctx: Context): boolean {
    const id = this.playerId.eval(ctx);
    if (id === 0) return false; // neutral is never a friend
    return id === ctx.state.mover || ctx.state.mover === ctx.game.numPlayers + 1;
  }
}

// Alias: (is Friendly ...)
/**
 * @java game.types.play.RoleType.toIntFunction(RoleType)
 */
function roleToIntFunction(role: RoleTypeFull): IntFunction {
  const key = role.toLowerCase();
  return {
    eval(ctx: Context): number {
      if (key === "mover") return ctx.state.mover;
      if (key === "next") return (ctx.state.mover % ctx.game.numPlayers) + 1;
      if (key === "prev") return ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
      if (key === "player") return ctx._evalPlayer ?? ctx.state.mover;
      if (key === "neutral" || key === "shared") return 0;
      const player = /^p(\d+)$/.exec(key);
      if (player) return Number(player[1]);
      const team = /^team(\d+)$/.exec(key);
      if (team) return Number(team[1]);
      return ctx.state.mover;
    },
  };
}

// @java Core/src/game/functions/booleans/is/player/IsActive.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { RoleTypeFull } from "../../../../types/play/RoleType.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";

/**
 * (is Active <who>)
 * Checks if the given player is still active (not eliminated).
 * @java game/functions/booleans/is/player/IsActive.java
 */
export class IsActive implements BooleanFunction {
  /** @java IsActive.playerId */
  private readonly playerId: IntFunction;

  /**
   * @java IsActive(@Or IntFunction indexPlayer, @Or RoleType role)
   */
  public constructor(indexPlayer: IntFunction | null, role: RoleTypeFull | null) {
    const numNonNull = (indexPlayer != null ? 1 : 0) + (role != null ? 1 : 0);
    if (numNonNull !== 1) {
      throw new Error("IsActive(): exactly one Or parameter must be non-null.");
    }

    this.playerId = indexPlayer ?? roleToIntFunction(role!);
  }

  /**
   * @java game/functions/booleans/is/player/IsActive.java — eval(Context):
   *   roleId == 0 || roleId > numPlayers → false; context.active(roleId)
   */
  public eval(ctx: Context): boolean {
    const roleId = this.playerId.eval(ctx);
    if (roleId === 0 || roleId > ctx.game.numPlayers) return false;
    // Java: context.active(roleId) — check if player is still active
    // In 1:1 state, we check the active array if present
    const state = ctx.state as unknown as { active?: boolean[] };
    if (state.active) {
      return state.active[roleId] !== false;
    }
    return true; // by default all players are active
  }
}

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

// @java Core/src/game/functions/booleans/is/player/IsActive.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";
import { compileInt1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

/**
 * (is Active <who>)
 * Checks if the given player is still active (not eliminated).
 * @java game/functions/booleans/is/player/IsActive.java
 */
export class IsActive1to1 implements BooleanFunction {
  /** @java IsActive.playerId */
  private readonly playerId: IntFunction;

  public constructor(playerId: IntFunction) {
    this.playerId = playerId;
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

registerBool1to1("is:active", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const whoNode = positional[1];
  if (!whoNode) {
    // (is Active) without arg — default to mover
    return { eval(ctx: Context): boolean {
      const roleId = ctx.state.mover;
      if (roleId === 0 || roleId > ctx.game.numPlayers) return false;
      const state = ctx.state as unknown as { active?: boolean[] };
      if (state.active) return state.active[roleId] !== false;
      return true;
    }};
  }
  const who = compileInt1to1(whoNode);
  return new IsActive1to1(who);
});

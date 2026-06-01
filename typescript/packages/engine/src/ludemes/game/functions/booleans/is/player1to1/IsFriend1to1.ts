// @java Core/src/game/functions/booleans/is/player/IsFriend.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";
import { compileInt1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

/**
 * (is Friend <who>) / (is Friendly <who>)
 * Checks if the given player is a friend of the mover (same team or is the mover).
 * Non-teams parity: friend iff player == mover (or mover is omniscient player).
 * @java game/functions/booleans/is/player/IsFriend.java
 */
export class IsFriend1to1 implements BooleanFunction {
  /** @java IsFriend.playerId */
  private readonly playerId: IntFunction;

  public constructor(playerId: IntFunction) {
    this.playerId = playerId;
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

registerBool1to1("is:friend", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const whoNode = positional[1];
  if (!whoNode) {
    return { eval(_ctx: Context): boolean { return false; } };
  }
  const who = compileInt1to1(whoNode);
  return new IsFriend1to1(who);
});

// Alias: (is Friendly ...)
registerBool1to1("is:friendly", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const whoNode = positional[1];
  if (!whoNode) {
    return { eval(_ctx: Context): boolean { return false; } };
  }
  const who = compileInt1to1(whoNode);
  return new IsFriend1to1(who);
});

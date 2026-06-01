// @java Core/src/game/functions/booleans/is/player/IsEnemy.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";
import { compileInt1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

/**
 * (is Enemy <who>)
 * Checks if the given player is an enemy of the mover (non-zero, different player).
 * @java game/functions/booleans/is/player/IsEnemy.java
 */
export class IsEnemy1to1 implements BooleanFunction {
  /** @java IsEnemy.playerId */
  private readonly playerId: IntFunction;

  public constructor(playerId: IntFunction) {
    this.playerId = playerId;
  }

  /**
   * @java game/functions/booleans/is/player/IsEnemy.java — eval(Context):
   *   Non-teams: roleId != 0 && roleId != mover
   */
  public eval(ctx: Context): boolean {
    const id = this.playerId.eval(ctx);
    if (id === 0) return false; // neutral is not an enemy
    return id !== ctx.state.mover;
  }
}

registerBool1to1("is:enemy", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const whoNode = positional[1];
  if (!whoNode) {
    return { eval(_ctx: Context): boolean { return false; } };
  }
  const who = compileInt1to1(whoNode);
  return new IsEnemy1to1(who);
});

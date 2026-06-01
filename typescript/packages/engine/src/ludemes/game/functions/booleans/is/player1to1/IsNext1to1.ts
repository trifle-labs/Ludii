// @java Core/src/game/functions/booleans/is/player/IsNext.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";
import { compileInt1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

/**
 * (is Next <who>)
 * Checks if the given player index equals the next player (mover % numPlayers + 1).
 * @java game/functions/booleans/is/player/IsNext.java
 */
export class IsNext1to1 implements BooleanFunction {
  /** @java IsNext.who */
  private readonly who: IntFunction;

  public constructor(who: IntFunction) {
    this.who = who;
  }

  /**
   * @java game/functions/booleans/is/player/IsNext.java — eval(Context):
   *   who.eval(context) == context.state().next()
   */
  public eval(ctx: Context): boolean {
    const next = (ctx.state.mover % ctx.game.numPlayers) + 1;
    return this.who.eval(ctx) === next;
  }
}

registerBool1to1("is:next", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const whoNode = positional[1];
  if (!whoNode) {
    return { eval(_ctx: Context): boolean { return false; } };
  }
  const who = compileInt1to1(whoNode);
  return new IsNext1to1(who);
});

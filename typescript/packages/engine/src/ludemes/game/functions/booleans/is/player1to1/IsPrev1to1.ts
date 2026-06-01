// @java Core/src/game/functions/booleans/is/player/IsPrev.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";
import { compileInt1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

/**
 * (is Prev <who>)
 * Checks if the given player index equals the previous mover.
 * prev = ((mover - 2 + numPlayers) % numPlayers) + 1
 * @java game/functions/booleans/is/player/IsPrev.java
 */
export class IsPrev1to1 implements BooleanFunction {
  /** @java IsPrev.who */
  private readonly who: IntFunction;

  public constructor(who: IntFunction) {
    this.who = who;
  }

  /**
   * @java game/functions/booleans/is/player/IsPrev.java — eval(Context):
   *   who.eval(context) == context.state().prev()
   */
  public eval(ctx: Context): boolean {
    const n = ctx.game.numPlayers;
    const prev = ((ctx.state.mover - 2 + n) % n) + 1;
    return this.who.eval(ctx) === prev;
  }
}

registerBool1to1("is:prev", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const whoNode = positional[1];
  if (!whoNode) {
    return { eval(_ctx: Context): boolean { return false; } };
  }
  const who = compileInt1to1(whoNode);
  return new IsPrev1to1(who);
});

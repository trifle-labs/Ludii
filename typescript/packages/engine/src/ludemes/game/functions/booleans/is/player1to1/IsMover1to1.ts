// @java Core/src/game/functions/booleans/is/player/IsMover.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";
import { compileInt1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

/**
 * (is Mover <who>)
 * Checks if the given player index equals the current mover.
 * @java game/functions/booleans/is/player/IsMover.java
 */
export class IsMover1to1 implements BooleanFunction {
  /** @java IsMover.who */
  private readonly who: IntFunction;

  public constructor(who: IntFunction) {
    this.who = who;
  }

  /** @java IsMover.eval(Context): who.eval(context) == context.state().mover() */
  public eval(ctx: Context): boolean {
    return this.who.eval(ctx) === ctx.state.mover;
  }
}

registerBool1to1("is:mover", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  // positional[0] = "Mover" ident, positional[1] = who int-fn
  const whoNode = positional[1];
  if (!whoNode) {
    // No argument: (is Mover) — compare ctx.state.mover to itself → always true
    return { eval(_ctx: Context): boolean { return true; } };
  }
  const who = compileInt1to1(whoNode);
  return new IsMover1to1(who);
});

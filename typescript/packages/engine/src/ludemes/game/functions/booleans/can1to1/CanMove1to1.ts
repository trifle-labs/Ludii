// @java Core/src/game/functions/booleans/can/CanMove.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";
import { parseArgs1to1 } from "../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import type { Game1to1 } from "../../../../Game1to1.js";

/** Module-level recursion guard — mirrors Java's ThreadLocal<Boolean> autoFail. */
let _canMoveActive = false;

/**
 * (can Move)
 * Checks if the current player can make at least one move.
 * @java game/functions/booleans/can/CanMove.java
 */
export class CanMove1to1 implements BooleanFunction {
  /**
   * @java CanMove.eval(Context):
   *   autoFail guard; game.moves(context).moves().isEmpty() ? false : true
   */
  public eval(ctx: Context): boolean {
    if (_canMoveActive) return false; // recursion guard
    _canMoveActive = true;
    try {
      const g = ctx.game as unknown as Game1to1;
      const moves = g.moves(ctx);
      return moves.length > 0;
    } catch {
      return false;
    } finally {
      _canMoveActive = false;
    }
  }
}

registerBool1to1("can", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const first = positional[0];
  if (!first || !isIdent(first) || first.name.toLowerCase() !== "move") {
    return { eval(_ctx: Context): boolean { return false; } };
  }
  return new CanMove1to1();
});

// @java Core/src/game/functions/booleans/is/connect/IsBlocked.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { Game1to1 } from "../../../../../Game1to1.js";

/**
 * (is Blocked <role>)
 * Checks whether the given player cannot possibly make a move (is in stalemate).
 *
 * Java parity note: the full IsBlocked implementation checks whether regions
 * can possibly be connected by a player. However, in end-rule context the most
 * common usage is (forEach Player if:(is Blocked Player)), which checks if the
 * currently-iterated player (context._evalPlayer) has no legal moves.
 *
 * @java game/functions/booleans/is/connect/IsBlocked.java
 */
export class IsBlocked implements BooleanFunction {
  /**
   * @java IsBlocked.eval(Context):
   *   Simplified: check if context._evalPlayer has no legal moves.
   */
  public eval(ctx: Context): boolean {
    const evalPlayer = ctx._evalPlayer;
    if (evalPlayer === undefined || evalPlayer <= 0) return false;
    // Temporarily swap mover to evalPlayer, generate moves, restore
    const origMover = ctx.state.mover;
    (ctx.state as unknown as { mover: number }).mover = evalPlayer;
    try {
      const g = ctx.game as unknown as Game1to1;
      const moves = g.moves ? g.moves(ctx) : [];
      return !moves || moves.length === 0;
    } finally {
      (ctx.state as unknown as { mover: number }).mover = origMover;
    }
  }
}


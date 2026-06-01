/**
 * @java game/functions/booleans/no/moves/NoMoves.java
 *
 * (no Moves Mover) / (no Moves Next) / (no Moves P1) etc.
 *
 * Checks whether the given player is stalemated (has no legal moves).
 * Java parity: reads context.state().isStalemated(playerId).
 *
 * In the 1:1 TS path, the stalemated flag is set by Game1to1.apply() when
 * the new mover has no legal moves. We read state.stalemated[playerId].
 *
 * For the special (no Moves Next) case, Java temporarily switches to the
 * next player to compute moves. In our implementation we rely on the
 * pre-computed stalemated flag in the state, updated during apply().
 *
 * @java game/functions/booleans/no/moves/NoMoves.java — eval(Context)
 */

import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";
import type { RoleType } from "../../../../base.js";

export class NoMoves implements BooleanFunction {
  /** The role whose moves we're checking. @java NoMoves.role */
  private readonly role: RoleType;

  /**
   * @java game/functions/booleans/no/moves/NoMoves.java — constructor(RoleType)
   */
  public constructor(role: RoleType) {
    this.role = role;
  }

  /**
   * @java game/functions/booleans/no/moves/NoMoves.java — eval(Context)
   *
   * Java lines 57-92: resolves the role to a player id, then returns
   * context.state().isStalemated(playerId).
   *
   * In the TS 1:1 path:
   *   Mover  → state.mover
   *   Next   → (state.mover % numPlayers) + 1  (next player in rotation)
   *   Prev   → ((state.mover - 2 + numPlayers) % numPlayers) + 1
   *   P1..PN → literal player index
   */
  public eval(ctx: Context): boolean {
    const state = ctx.state;
    const numPlayers = ctx.game.numPlayers;
    let playerId: number;

    switch (this.role) {
      case "Mover":
        playerId = state.mover;
        break;
      case "Next":
        // Java: state.next() — the player who moves next
        playerId = (state.mover % numPlayers) + 1;
        break;
      default: {
        // P1, P2, etc.
        const n = parseInt((this.role as string).slice(1), 10);
        playerId = isNaN(n) ? state.mover : n;
        break;
      }
    }

    // Java: context.state().isStalemated(playerId)
    return state.stalemated[playerId] === true;
  }
}

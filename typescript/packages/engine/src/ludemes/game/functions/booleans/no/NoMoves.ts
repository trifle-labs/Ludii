/**
 * @java game/functions/booleans/no/moves/NoMoves.java
 *
 * (no Moves Mover) / (no Moves Next) / (no Moves P1) etc.
 *
 * Checks whether the given player is stalemated (has no legal moves).
 *
 * Java parity (NoMoves.java:57-92):
 *   For role=Next, Java temporarily switches the mover to the next player,
 *   recomputes the stalemated flag, then restores the original mover.
 *   This is necessary because the stalemated cache is only updated for the
 *   current mover after each move — it is NOT pre-computed for the opponent.
 *
 *   For other roles (Mover, P1, P2, ...), Java reads the cached
 *   context.state().isStalemated(playerId) directly.
 *
 * @java game/functions/booleans/no/moves/NoMoves.java — eval(Context)
 */

import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";
import type { RoleType } from "../../../../base.js";
import type { Game1to1, Context1to1 } from "../../../../Game1to1.js";
import { Context as ContextClass } from "../../../../../context.js";

/** Recursion guard: prevent NoMoves(Next) from calling itself. */
let _noMovesNextActive = false;

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
   * For role=Next: temporarily switch the mover to the next player, generate
   * their moves, and return true if they have none.
   * @java NoMoves.java:57-92 — the "Next" special-case with autoFail guard
   *
   * For other roles: read from state.stalemated[playerId].
   */
  public eval(ctx: Context): boolean {
    const state = ctx.state;
    const numPlayers = ctx.game.numPlayers;

    if (this.role === "Next") {
      // @java NoMoves.java:60-91 — special case: temporarily switch to next player
      // and compute legal moves rather than relying on the cached flag.
      if (_noMovesNextActive) return false; // @java autoFail guard

      const nextPlayer = state.next > 0
        ? state.next
        : (state.mover % numPlayers) + 1;

      _noMovesNextActive = true;
      try {
        const game = ctx.game as unknown as Game1to1;
        if (!game || !game.equipment) return state.stalemated[nextPlayer] === true;

        // Build a temp context for the next player.
        const nextState = state.withMover(nextPlayer);
        const tempCtx = new ContextClass(
          ctx.game,
          nextState,
          ctx.trial,
          ctx.rng,
        ) as Context1to1;
        const ctxAny = ctx as unknown as Context1to1;
        tempCtx._radials = ctxAny._radials ?? game.equipment.board.radials;
        tempCtx._trajectories = ctxAny._trajectories ?? game.equipment.board.trajectories;
        tempCtx._evalTo = -1;
        tempCtx._evalFrom = -1;
        tempCtx._evalValue = 0;

        // Get the play rules for the next player's phase.
        const phaseIdx = nextState.phase?.(nextPlayer) ?? 0;
        const phases = game.rules.phases;
        const playRules =
          phases && phaseIdx >= 0 && phaseIdx < phases.length
            ? phases[phaseIdx]!.play
            : game.rules.play;

        const moves = playRules.moves.eval(tempCtx);
        return moves.length === 0;
      } finally {
        _noMovesNextActive = false;
      }
    }

    // For Mover, P1, P2, ...: read the cached stalemated flag.
    let playerId: number;
    switch (this.role) {
      case "Mover":
        playerId = state.mover;
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

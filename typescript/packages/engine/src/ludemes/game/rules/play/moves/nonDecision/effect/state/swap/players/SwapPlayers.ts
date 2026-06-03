// @java Core/src/game/rules/play/moves/nonDecision/effect/state/swap/players/SwapPlayers.java
/**
 * Swap two players.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/state/swap/players/SwapPlayers.java
 */

import type { Context } from "../../../../../../../../../../context.js";
import type { IntFunction, MovesFunction } from "../../../../../../../../../base.js";
import type { Move } from "../../../../../../../../../../move.js";
import type { Then } from "../../../Then.js";
import { ActionSwap } from "../../../../../../../../../../action/action-swap.js";
import { ActionSetNextPlayer } from "../../../../../../../../../../action/action-set-next-player.js";
import { Move as LudiiMove } from "../../../../../../../../../../move.js";

export class SwapPlayers implements MovesFunction {
  /** @java SwapPlayers.player1 */
  private readonly player1: IntFunction;

  /** @java SwapPlayers.player2 */
  private readonly player2: IntFunction;

  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/state/swap/players/SwapPlayers.java — constructor
   *
   * @param player1    Function evaluating the first player index
   * @param player2    Function evaluating the second player index
   * @param thenClause Subsequent moves
   */
  public constructor(
    player1: IntFunction,
    player2: IntFunction,
    thenClause: Then | null = null,
  ) {
    this.player1 = player1;
    this.player2 = player2;
    this.thenClause = thenClause;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/state/swap/players/SwapPlayers.java — eval(Context)
   *
   * Emits a single move with:
   *   1. ActionSwap(pid1, pid2) — marked as decision
   *   2. ActionSetNextPlayer(context.state().mover()) — keep same mover after swap
   */
  public eval(ctx: Context): Move[] {
    const pid1 = this.player1.eval(ctx);
    const pid2 = this.player2.eval(ctx);
    const mover = ctx.state.mover;

    // @java SwapPlayers.java:70-73 — ActionSwap(pid1, pid2) + ActionSetNextPlayer
    const actionSwap = new ActionSwap(pid1, pid2);
    const actionNext = new ActionSetNextPlayer(mover);

    const move = new LudiiMove({
      id: `swapPlayers:${mover}:${pid1}:${pid2}`,
      label: `SwapPlayers(${pid1}↔${pid2})`,
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions: [actionSwap, actionNext],
    });

    // @java SwapPlayers.java:77-78 — then clause
    if (this.thenClause != null) {
      const thenMoves = this.thenClause.eval(ctx);
      return [move.withConsequence(
        thenMoves.flatMap(tm => [...tm.actions]),
        false,
      )];
    }

    return [move];
  }
}

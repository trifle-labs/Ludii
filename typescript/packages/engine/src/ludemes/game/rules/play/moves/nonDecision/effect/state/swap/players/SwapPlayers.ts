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
import { applyPostStateThen } from "../../../Then.js";
import { ActionSwap } from "../../../../../../../../../../action/action-swap.js";
import { ActionSetNextPlayer } from "../../../../../../../../../../action/action-set-next-player.js";
import { Move as LudiiMove } from "../../../../../../../../../../move.js";

type RoleType = string;

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
   * @param player1    The index of the first player.
   * @param role1      The role of the first player.
   * @param player2    The index of the second player.
   * @param role2      The role of the second player.
   * @param thenClause Subsequent moves.
   */
  public constructor(
    player1: IntFunction | null,
    role1: RoleType | null,
    player2: IntFunction | null,
    role2: RoleType | null,
    thenClause?: Then | null,
  ) {
    this.player1 = player1 === null ? roleToIntFunction(role1!) : player1;
    this.player2 = player2 === null ? roleToIntFunction(role2!) : player2;
    this.thenClause = thenClause ?? null;
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

    // @java SwapPlayers.java:77-78 — then clause. Move.apply evaluates then()
    // AFTER the action, so defer instead of baking the pre-move eval.
    return [applyPostStateThen(this.thenClause, ctx, move)];
  }
}

/**
 * Minimal port of Java's RoleType.toIntFunction.
 *
 * @java game.types.play.RoleType.toIntFunction(RoleType)
 */
function roleToIntFunction(role: RoleType): IntFunction {
  return {
    eval: (ctx: Context): number => {
      switch (role) {
        case "Mover":
          return ctx.state.mover;
        case "Next": {
          const n = ctx.state.mover;
          const numP = ctx.numPlayers();
          return (n % numP) + 1;
        }
        case "P1":
          return 1;
        case "P2":
          return 2;
        case "P3":
          return 3;
        case "P4":
          return 4;
        default:
          return ctx.state.mover;
      }
    },
  };
}

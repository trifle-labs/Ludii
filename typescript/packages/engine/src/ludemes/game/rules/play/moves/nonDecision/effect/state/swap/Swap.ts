// @java Core/src/game/rules/play/moves/nonDecision/effect/state/swap/Swap.java
/**
 * Swaps two players or two pieces.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/state/swap/Swap.java
 *
 * @remarks This is a factory class — `Swap.construct()` returns either a
 *          SwapPieces or a SwapPlayers instance, never a Swap directly.
 *          The `eval()` method intentionally throws (matching Java).
 */

import type { Context } from "../../../../../../../../../context.js";
import type { IntFunction, MovesFunction } from "../../../../../../../../base.js";
import type { Move } from "../../../../../../../../../move.js";
import type { Then } from "../../Then.js";
import { SwapSitesType } from "./SwapSitesType.js";
import { SwapPlayersType } from "./SwapPlayersType.js";
import { SwapPieces } from "./sites/SwapPieces.js";
import { SwapPlayers } from "./players/SwapPlayers.js";

// Re-export for callers that only import from this file
export { SwapSitesType, SwapPlayersType };

export class Swap implements MovesFunction {
  // @java Swap.java:115-118 — private default constructor
  private constructor() {}

  // -------------------------------------------------------------------------

  /**
   * Factory: swap two pieces.
   *
   * @java game/rules/play/moves/nonDecision/effect/state/swap/Swap.java —
   *        construct(SwapSitesType, IntFunction, IntFunction, Then)
   *
   * @param swapType  Must be SwapSitesType.Pieces
   * @param locA      First location [lastFrom if null]
   * @param locB      Second location [lastTo if null]
   * @param then      Subsequent moves [null]
   */
  public static constructPieces(
    swapType: SwapSitesType,
    locA: IntFunction | null = null,
    locB: IntFunction | null = null,
    then: Then | null = null,
  ): MovesFunction {
    // @java Swap.java:47-53
    switch (swapType) {
      case SwapSitesType.Pieces:
        return new SwapPieces(
          locA ?? { eval: (ctx: Context) => ctx._evalFrom },
          locB ?? { eval: (ctx: Context) => ctx._evalTo },
          then,
        );
      default:
        break;
    }
    throw new Error(`Swap.constructPieces(): SwapSitesType '${String(swapType)}' is not implemented.`);
  }

  /**
   * Factory: swap two players.
   *
   * @java game/rules/play/moves/nonDecision/effect/state/swap/Swap.java —
   *        construct(SwapPlayersType, IntFunction, RoleType, IntFunction, RoleType, Then)
   *
   * Exactly one of (player1 / role1) must be non-null, and exactly one of
   * (player2 / role2) must be non-null.
   *
   * @param takeType  Must be SwapPlayersType.Players
   * @param player1   Index fn for first player [null if role1 is used]
   * @param role1     Role string for first player [null if player1 is used]
   * @param player2   Index fn for second player [null if role2 is used]
   * @param role2     Role string for second player [null if player2 is used]
   * @param then      Subsequent moves [null]
   */
  public static constructPlayers(
    takeType: SwapPlayersType,
    player1: IntFunction | null,
    role1: string | null,
    player2: IntFunction | null,
    role2: string | null,
    then: Then | null = null,
  ): MovesFunction {
    // @java Swap.java:83-99 — validate @Or constraints
    const numNonNull1 = (player1 !== null ? 1 : 0) + (role1 !== null ? 1 : 0);
    if (numNonNull1 !== 1) {
      throw new Error("Swap.constructPlayers(): Exactly one player1 or role1 parameter must be non-null.");
    }
    const numNonNull2 = (player2 !== null ? 1 : 0) + (role2 !== null ? 1 : 0);
    if (numNonNull2 !== 1) {
      throw new Error("Swap.constructPlayers(): Exactly one player2 or role2 parameter must be non-null.");
    }

    switch (takeType) {
      case SwapPlayersType.Players:
        return new SwapPlayers(player1, role1, player2, role2, then);
      default:
        break;
    }
    throw new Error(`Swap.constructPlayers(): SwapPlayersType '${String(takeType)}' is not implemented.`);
  }

  // -------------------------------------------------------------------------

  /**
   * @java Swap.java:122-124 — should never be called directly
   */
  public eval(_ctx: Context): Move[] {
    throw new Error("Swap.eval(): Should never be called directly.");
  }

  /**
   * @java Swap.java:130 — isStatic() always false (should never be called)
   */
  public isStatic(): boolean {
    return false;
  }

  /**
   * @java Swap.java:150-153 — canMoveTo() should never be called
   */
  public canMoveTo(_ctx: Context, _target: number): boolean {
    throw new Error("Swap.canMoveTo(): Should never be called directly.");
  }
}

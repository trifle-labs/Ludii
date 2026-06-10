// @java Core/src/game/rules/play/moves/nonDecision/effect/state/swap/sites/SwapPieces.java
/**
 * Swaps two pieces on the board.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/state/swap/sites/SwapPieces.java
 */

import type { Context } from "../../../../../../../../../../context.js";
import type { IntFunction, MovesFunction } from "../../../../../../../../../base.js";
import type { Move } from "../../../../../../../../../../move.js";
import type { Then } from "../../../Then.js";
import { ActionMove } from "../../../../../../../../../../action/action-move.js";
import { ActionAdd } from "../../../../../../../../../../action/action-add.js";
import { Move as LudiiMove } from "../../../../../../../../../../move.js";

export class SwapPieces implements MovesFunction {
  /** @java SwapPieces.locAFn — first location [default: lastFrom] */
  private readonly locAFn: IntFunction;

  /** @java SwapPieces.locBFn — second location [default: lastTo] */
  private readonly locBFn: IntFunction;

  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/state/swap/sites/SwapPieces.java — constructor
   *
   * @param locAFn    First location (default: lastFrom = ctx._evalFrom)
   * @param locBFn    Second location (default: lastTo = ctx._evalTo)
   * @param thenClause Subsequent moves
   */
  public constructor(
    locAFn: IntFunction,
    locBFn: IntFunction,
    thenClause: Then | null = null,
  ) {
    this.locAFn = locAFn;
    this.locBFn = locBFn;
    this.thenClause = thenClause;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/state/swap/sites/SwapPieces.java — eval(Context)
   *
   * Swaps the pieces at locA and locB:
   *   1. ActionMove(locA → locB) — moves piece from A to B (replaces what was at B)
   *   2. ActionAdd(locA, whatB) — places what was at B back onto locA
   */
  public eval(ctx: Context): Move[] {
    const locA = this.locAFn.eval(ctx);
    const locB = this.locBFn.eval(ctx);
    const mover = ctx.state.mover;

    // @java SwapPieces.java:73-74 — get whatB = what is currently at locB
    const whatB = ctx.state.what(locB);

    // @java SwapPieces.java:76-78 — ActionMove(locA → locB)
    const actionMove = new ActionMove({ from: locA, to: locB });

    // @java SwapPieces.java:80-82 — ActionAdd(locA, whatB) — place whatB back
    const actionAdd = new ActionAdd({ to: locA, what: whatB, owner: mover });

    const move = new LudiiMove({
      id: `swapPieces:${mover}:${locA}:${locB}`,
      label: `SwapPieces(${locA}↔${locB})`,
      siteIndices: [locA, locB],
      mover,
      placedOwner: mover,
      actions: [actionMove, actionAdd],
      fromNonDecisionSite: locA,
      toNonDecisionSite: locB,
    });

    // @java SwapPieces.java:91-93 — then clause
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

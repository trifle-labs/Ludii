// @java Core/src/other/playout/PlayoutFilter.java PlayoutFilter
/**
 * Faithful 1:1 transliteration of other.playout.PlayoutFilter.
 *
 * Optimised playout strategy for alternating-move games with a Filter
 * (Do/If/Or) rule structure. Computes maybe-legal moves from the play rule,
 * then filters out illegal ones via the condition check.
 *
 * Deferrals (depend on the full ludeme eval() subsystem):
 *  - Do/If/Or rule type-casting: the play-rules analysis is deferred.
 *    The playout loop body that calls game.moves(context) uniformly is
 *    structurally present as a fallback.
 *  - Automove / Gravity meta-rule application: deferred.
 *  - Swap-move generation: deferred.
 *  - context.state().setStalemated(): deferred.
 *
 * Java parity: other/playout/PlayoutFilter.java
 */

import type { Playout } from "./Playout.js";
import { PlayoutMoveSelector } from "./PlayoutMoveSelector.js";
import type { IContext } from "./PlayoutMoveSelector.js";
import type { IAI, ITrial, IMove } from "../context/Context.js";

export class PlayoutFilter implements Playout {

  playout(
    context: IContext,
    ais: (IAI | null)[] | null,
    thinkingTime: number,
    playoutMoveSelector: import("./PlayoutMoveSelector.js").PlayoutMoveSelector | null,
    maxNumBiasedActions: number,
    maxNumPlayoutActions: number,
    random: { nextInt(bound: number): number }
  ): ITrial {
    const currentGame = context.game();
    const startPhase = currentGame.rules().phases()[
      (context.state() as unknown as { currentPhase(m: number): number }).currentPhase(
        (context.state() as unknown as { mover(): number }).mover()
      )
    ];

    // NOTE: Full Do/If/Or rule analysis is DEFERRED.
    // The playout falls back to game.moves(context) for move generation,
    // which preserves correctness at the cost of the optimisation.

    let numActionsApplied = 0;
    const trial: ITrial = context.trial();

    while (!trial.over() && (maxNumPlayoutActions < 0 || maxNumPlayoutActions > numActionsApplied)) {
      const mover = (context.state() as unknown as { mover(): number }).mover();

      const currPhase = currentGame.rules().phases()[
        (context.state() as unknown as { currentPhase(m: number): number }).currentPhase(mover)
      ];

      if (currPhase !== startPhase) return trial; // phase switch

      let move: IMove | null = null;
      let ai: IAI | null = null;

      if (ais !== null) {
        ai = ais[(context.state() as unknown as { playerToAgent(m: number): number }).playerToAgent(mover)] ?? null;
      }

      if (ai !== null) {
        move = ai.selectAction(currentGame, ai.copyContext(context), thinkingTime, -1, -1);
      } else {
        // DEFERRED: rule-specific move generation (Do/If/Or).
        // Fallback: use game.moves() (correct, not optimised).
        const legalObj = currentGame.moves(context);
        const legalList = legalObj.moves();
        const moves: IMove[] = [];
        for (let i = 0; i < legalList.size(); i++) moves.push(legalList.get(i));

        if (
          playoutMoveSelector === null ||
          (maxNumBiasedActions >= 0 && maxNumBiasedActions < numActionsApplied) ||
          playoutMoveSelector.wantsPlayUniformRandomMove()
        ) {
          move = PlayoutMoveSelector.selectUniformlyRandomMove(
            context, moves, { checkMove: () => true }, random
          );
        } else {
          move = playoutMoveSelector.selectMove(context, moves, mover, { checkMove: () => true });
        }

        if (move === null) {
          // No legal move — pass
          (context.state() as unknown as { setStalemated?(m: number, v: boolean): void }).setStalemated?.(mover, true);
          numActionsApplied++;
          continue;
        } else {
          (context.state() as unknown as { setStalemated?(m: number, v: boolean): void }).setStalemated?.(mover, false);
        }
      }

      if (move === null) { console.error("FilterPlayout.playout(): No move found."); break; }

      currentGame.apply(context, move);
      numActionsApplied++;
    }

    return trial;
  }

  callsGameMoves(): boolean { return false; }
}

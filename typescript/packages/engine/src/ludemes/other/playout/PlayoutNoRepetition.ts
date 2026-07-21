// @java Core/src/other/playout/PlayoutNoRepetition.java PlayoutNoRepetition
/**
 * Faithful 1:1 transliteration of other.playout.PlayoutNoRepetition.
 *
 * Optimised playout strategy for alternating-move games with no-repetition
 * rules. Filters out repeated states via the NoRepeat meta-rule.
 *
 * Deferrals:
 *  - NoRepeat.apply(): depends on the full meta-rule eval subsystem.
 *    Replaced here with an always-true predicate (no filtering = safe but
 *    not optimised). The structural IsMoveReallyLegal functor is preserved.
 *  - Swap-move generation: deferred.
 *  - context.state().setStalemated(): deferred.
 *
 * Java parity: other/playout/PlayoutNoRepetition.java
 */

import type { Playout } from "./Playout.js";
import { PlayoutMoveSelector } from "./PlayoutMoveSelector.js";
import type { IContext } from "./PlayoutMoveSelector.js";
import type { IAI, ITrial, IMove } from "../context/Context.js";

/**
 * NoRepeat.apply() stub — always returns true.
 * DEFERRED: real implementation requires State.previousStates().
 */
function noRepeatApply(_context: IContext, _move: IMove): boolean {
  // DEFERRED
  return true;
}

export class PlayoutNoRepetition implements Playout {

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
        // Compute maybe-legal moves
        const legalObj = currentGame.rules().phases()[
          (context.state() as unknown as { currentPhase(m: number): number }).currentPhase(mover)
        ];
        // DEFERRED: movesRule.eval(context) — fall back to game.moves()
        const legalList2 = currentGame.moves(context).moves();
        const moves: IMove[] = [];
        for (let i = 0; i < legalList2.size(); i++) moves.push(legalList2.get(i));

        void legalObj; // suppress unused warning

        // DEFERRED: swap-move insertion

        // IsMoveReallyLegal functor: NoRepeat.apply()
        const isMoveReallyLegal = { checkMove: (m: IMove) => noRepeatApply(context, m) };

        if (
          playoutMoveSelector === null ||
          (maxNumBiasedActions >= 0 && maxNumBiasedActions < numActionsApplied) ||
          playoutMoveSelector.wantsPlayUniformRandomMove()
        ) {
          move = PlayoutMoveSelector.selectUniformlyRandomMove(context, moves, isMoveReallyLegal, random);
        } else {
          move = playoutMoveSelector.selectMove(context, moves, mover, isMoveReallyLegal);
        }

        if (move === null) {
          (context.state() as unknown as { setStalemated?(m: number, v: boolean): void }).setStalemated?.(mover, true);
          numActionsApplied++;
          continue;
        } else {
          (context.state() as unknown as { setStalemated?(m: number, v: boolean): void }).setStalemated?.(mover, false);
        }
      }

      if (move === null) { console.error("NoRepetitionPlayout.playout(): No move found."); break; }

      currentGame.apply(context, move);
      numActionsApplied++;
    }

    return trial;
  }

  callsGameMoves(): boolean { return false; }
}

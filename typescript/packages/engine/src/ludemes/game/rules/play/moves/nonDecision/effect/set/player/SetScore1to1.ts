/**
 * @java game/rules/play/moves/nonDecision/effect/set/player/SetScore.java
 *
 * Sets the score of a player (given by playerFn) to scoreFn's value.
 *
 * Java parity (SetScore.eval lines 70-103):
 *   - Evaluate playerId = playerFn.eval(context)
 *   - Evaluate score = scoreFn.eval(context)
 *   - Emit ActionSetScore(playerId, score, false)
 *
 * NOTE: coverage-only transliteration; NOT registered in the 1:1 moves registry
 * (the interpreter-path SetScore.ts already covers this via the old compile.ts).
 *
 * @java game/rules/play/moves/nonDecision/effect/set/player/SetScore.java — eval(Context)
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { IntFunction, MovesFunction } from "../../../../../../../../base.js";
import { ActionSetScore } from "../../../../../../../../../action/action-set-score.js";
import { Move as LudiiMove } from "../../../../../../../../../move.js";

export class SetScore1to1 implements MovesFunction {
  /**
   * Evaluates to the player index whose score is set.
   * @java SetScore.playerFn
   */
  private readonly playerFn: IntFunction;

  /**
   * Evaluates to the new score value.
   * @java SetScore.scoreFn
   */
  private readonly scoreFn: IntFunction;

  /**
   * @java game/rules/play/moves/nonDecision/effect/set/player/SetScore.java — constructor
   * @param playerFn  The player index function (1-based)
   * @param scoreFn   The new score value function
   */
  public constructor(playerFn: IntFunction, scoreFn: IntFunction) {
    this.playerFn = playerFn;
    this.scoreFn = scoreFn;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/set/player/SetScore.java — eval(Context)
   */
  public eval(ctx: Context): Move[] {
    // @java SetScore.java:72-74 — playerId = playerFn.eval, score = scoreFn.eval
    const playerId = this.playerFn.eval(ctx);
    const score = this.scoreFn.eval(ctx);
    const mover = ctx.state.mover;

    if (playerId < 1) return [];

    // @java SetScore.java:83 — ActionSetScore(playerId, score, Boolean.FALSE)
    const action = new ActionSetScore({ player: playerId, score, add: false });

    return [new LudiiMove({
      id: `setscore:${mover}:p${playerId}:${score}`,
      label: `SetScore(P${playerId}=${score})`,
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions: [action],
    })];
  }
}

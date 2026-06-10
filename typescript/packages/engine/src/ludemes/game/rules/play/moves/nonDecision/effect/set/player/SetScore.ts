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
import type { RoleTypeFull } from "../../../../../../../types/play/RoleType.js";
import type { Player } from "../../../../../../../util/moves/Player.js";
import type { Then } from "../../Then.js";

export class SetScore implements MovesFunction {
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
   * @param player The index of the player.
   * @param role   The roleType of the player.
   * @param score  The new score.
   * @param then   The moves applied after that move is applied.
   */
  public constructor(
    player: Player | null,
    role: RoleTypeFull | null,
    score: IntFunction,
    then: Then | null = null,
  ) {
    void then;
    this.playerFn = player === null ? roleToIntFunction(role) : player.index();
    this.scoreFn = score;
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

function roleToIntFunction(role: RoleTypeFull | null): IntFunction {
  if (role === null) {
    throw new Error("SetScore: exactly one of player or role must be non-null.");
  }

  const owner = staticRoleOwner(role);
  if (owner !== null) return { eval: () => owner };

  return {
    eval: (ctx): number => {
      if (role === "Mover") return ctx.state.mover;
      if (role === "Next") return (ctx.state.mover % ctx.game.numPlayers) + 1;
      if (role === "Prev") return ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
      if (role === "Player") return ctx._evalPlayer ?? ctx.state.mover;
      if (role === "Shared" || role === "All") return ctx.game.numPlayers + 1;
      return ctx.state.mover;
    },
  };
}

function staticRoleOwner(role: RoleTypeFull): number | null {
  if (/^P\d+$/.test(role)) return Number(role.slice(1));
  if (role === "Neutral" || role === "Shared") return 0;
  return null;
}

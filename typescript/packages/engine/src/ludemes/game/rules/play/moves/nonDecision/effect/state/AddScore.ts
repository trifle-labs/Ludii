// @java game/rules/play/moves/nonDecision/effect/state/AddScore.java
//
// Faithful implementation: (addScore <role> <delta>) emits a Move containing
// ActionSetScore(playerId, delta, add=true) so that the player's score is
// incremented when the move is applied.
//
// Used in Dala, Morris-family games, etc. to track "mills" (lines of 3)
// formed during play, enabling (score Mover) checks for removal gating.
//
// @java game/rules/play/moves/nonDecision/effect/state/AddScore.java

import type { Context } from "../../../../../../../../context.js";
import { Move } from "../../../../../../../../move.js";
import type { Move as IMove } from "../../../../../../../../move.js";
import type { MovesFunction, IntFunction, RoleType } from "../../../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, isList, type LudList } from "@ludii/typescript-language";
import { ActionSetScore } from "../../../../../../../../action/action-set-score.js";
import type { Then } from "../Then.js";
import type { Player } from "../../../../../../util/moves/Player.js";

type AddScoreRole = RoleType | "Each";
type AddScorePlayerArg = Player | readonly IntFunction[] | null;
type AddScoreRoleArg = AddScoreRole | readonly AddScoreRole[] | null;
type AddScoreScoreArg = IntFunction | readonly IntFunction[] | null;

const DEFAULT_SCORE: IntFunction = { eval: () => 1 };

/**
 * (addScore <role> <scoreInt>) — add delta to a player's score as a move effect.
 *
 * Emits a Move with ActionSetScore(player, delta, add=true) so the score is
 * incremented when the move is applied to the game state.
 *
 * @java game/rules/play/moves/nonDecision/effect/state/AddScore.java
 */
export class AddScore implements MovesFunction {
  private readonly players: readonly IntFunction[];
  private readonly roles: readonly AddScoreRole[] | null;
  private readonly scores: readonly IntFunction[];
  /** @java Effect.then — consequence applied after the score is added. */
  private readonly thenClause: Then | null = null;

  public constructor(
    playerOrPlayers: AddScorePlayerArg,
    roleOrRoles: AddScoreRoleArg,
    scoreOrScores: AddScoreScoreArg,
    then?: Then | null,
  ) {
    this.thenClause = then ?? null;

    const arrayOverload =
      Array.isArray(playerOrPlayers) ||
      Array.isArray(roleOrRoles) ||
      Array.isArray(scoreOrScores);

    if (arrayOverload) {
      const players = Array.isArray(playerOrPlayers) ? playerOrPlayers : null;
      const roles = Array.isArray(roleOrRoles) ? roleOrRoles : null;
      AddScore.checkExactlyOne(players, roles);

      if (!Array.isArray(scoreOrScores)) {
        throw new Error("AddScore: array constructor requires IntFunction[] scores.");
      }

      this.roles = roles;
      this.players = players !== null ? players : roles!.map(AddScore.roleToIntFunction);
      this.scores = scoreOrScores;
      return;
    }

    const player = playerOrPlayers as Player | null;
    const role = roleOrRoles as AddScoreRole | null;
    const score = scoreOrScores as IntFunction | null;
    AddScore.checkExactlyOne(player, role);

    this.roles = role === null ? null : [role];
    this.players = player === null ? [AddScore.roleToIntFunction(role!)] : [player.index()];
    this.scores = [score ?? DEFAULT_SCORE];
  }

  /**
   * @java AddScore.eval(Context):
   *   For each affected player, emit a Move with ActionSetScore(pid, delta, add=true).
   */
  public eval(ctx: Context): IMove[] {
    const mover = ctx.state.mover;
    const length = Math.min(this.players.length, this.scores.length);

    const result: IMove[] = [];
    for (let i = 0; i < length; i++) {
      const delta = this.scores[i]!.eval(ctx);
      const pids = this.roles === null
        ? [this.players[i]!.eval(ctx)]
        : AddScore.roleToPlayerIds(this.roles[i]!, ctx);

      for (const pid of pids) {
        const action = new ActionSetScore({ player: pid, score: delta, add: true });
        const deferredThens = this.thenClause != null
          ? [{ eval: (c: Context): IMove[] => {
              const r = (this.thenClause as unknown as { moves(): { eval(c: Context): IMove[] | { moves(): IMove[] } } }).moves().eval(c);
              return Array.isArray(r) ? r : r.moves();
            } }]
          : [];
        const m = new Move({
          id: `addScore:${pid}:${delta}`,
          label: `AddScore`,
          siteIndices: [],
          mover,
          placedOwner: mover,
          actions: [action],
          deferredThens,
        });
        result.push(m);
      }
    }
    return result;
  }

  private static checkExactlyOne(left: unknown, right: unknown): void {
    let numNonNull = 0;
    if (left !== null) numNonNull++;
    if (right !== null) numNonNull++;
    if (numNonNull !== 1) {
      throw new Error("Exactly one Or parameter must be non-null.");
    }
  }

  private static roleToIntFunction(role: AddScoreRole): IntFunction {
    const key = role.toLowerCase();
    return {
      eval(ctx): number {
        if (key === "mover") return ctx.state.mover;
        if (key === "next") return (ctx.state.mover % ctx.game.numPlayers) + 1;
        const match = /^p(\d+)$/.exec(key);
        return match ? Number(match[1]) : ctx.state.mover;
      },
    };
  }

  private static roleToPlayerIds(role: AddScoreRole, ctx: Context): number[] {
    const key = role.toLowerCase();
    if (key === "all" || key === "each") {
      const pids: number[] = [];
      for (let p = 1; p <= ctx.game.numPlayers; p++) pids.push(p);
      return pids;
    }
    return [AddScore.roleToIntFunction(role).eval(ctx)];
  }
}

// @java AddScore.java — compile factory: (addScore <role> <delta>)

/**
 * Initialises the score of one or more players.
 *
 * @java game/rules/start/set/player/SetScore.java — eval(Context)
 *
 * DEFERRED: Java ActionSetScore modifies State.scores[] via Context.
 * The applyToInitialState interface only provides cells/whats/countAt arrays.
 * Score initialisation cannot be applied until Game1to1.start() accepts a
 * scores[] array or the StartRule interface is extended with scores/amounts.
 * The compile1to1 path currently skips (set Score …) start rules.
 */

import { IntConstant } from "../../../../functions/ints/IntConstant.js";
import type { IntFunction } from "../../../../../base.js";
import type { Context } from "../../../../../../context.js";
import type { StartRule } from "../../StartRule.js";

/** @java game/types/play/RoleType.java */
export type RoleType = string;

/**
 * @java game/rules/start/set/player/SetScore.java
 *
 * Initialises the score of the given player(s) to a constant value.
 * applyToInitialState is a no-op because scores[] is not in the interface.
 */
export class SetScore implements StartRule {
  /**
   * Player functions to set, or empty if `initSameScoreToEachPlayer` applies.
   * Java: players[] (length 0 when Each/All roleType).
   */
  private readonly players: readonly IntFunction[];

  /** Score functions parallel to playerIds, or single value for each-player mode. */
  private readonly scores: readonly (IntFunction | null)[];

  /**
   * True when the Java roleType is Each/All — set same score to every player.
   * Java: InitSameScoreToEachPlayer field.
   */
  private readonly initSameScoreToEachPlayer: boolean;

  /**
   * @param role  The roleType of a player.
   * @param score The new score of a player.
   * @java SetScore(RoleType role, @Opt IntFunction score)
   */
  public constructor(role: RoleType, score: IntFunction | null = null) {
    if (role === "Each" || role === "All") {
      this.initSameScoreToEachPlayer = true;
      this.players = [];
    } else {
      this.initSameScoreToEachPlayer = false;
      this.players = [roleToIntFunction(role)];
    }

    this.scores = [score];
  }

  /**
   * @java game/rules/start/set/player/SetScore.java — eval(Context)
   *
   * Java: ActionSetScore(playerId, score, FALSE).apply(context) for each player.
   * TS-deferred: scores[] not available in applyToInitialState interface.
   */
  /**
   * @java game/rules/start/set/player/SetScore.java — eval(Context)
   * Java: ActionSetScore(playerId, score, FALSE).apply(context) for each player.
   */
  public eval(ctx: Context): void {
    const cs = (ctx as unknown as { _startState?: { setSite(site: number, who: number, what: number, count: number, stateVal: number, value: number): void; setScore(pid: number, score: number): void; setAmount(pid: number, amount: number): void } })._startState;
    if (!cs) return;
    const numPlayers = (ctx.game as unknown as { numPlayers: number }).numPlayers;
    if (this.initSameScoreToEachPlayer) {
      const score = this.scores[0]?.eval(ctx) ?? 0;
      // @java ActionSetScore(pid, score).apply(context) -> State.setScore
      for (let pid = 1; pid <= numPlayers; pid++) cs.setScore(pid, score);
      return;
    }
    for (let i = 0; i < this.players.length; i++) {
      const pid = this.players[i]!.eval(ctx);
      const score = this.scores[i]?.eval(ctx) ?? 0;
      cs.setScore(pid, score);
    }
  }
}

function roleToIntFunction(role: RoleType): IntFunction {
  const owner = staticRoleOwner(role);
  if (owner !== null) return new IntConstant(owner);

  return {
    eval: (ctx: Parameters<IntFunction["eval"]>[0]): number => {
      if (role === "Mover") return ctx.state.mover;
      if (role === "Next") return (ctx.state.mover % ctx.game.numPlayers) + 1;
      if (role === "Prev") return ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
      if (role === "Player") return ctx._evalPlayer ?? ctx.state.mover;
      return 0;
    },
  };
}

function staticRoleOwner(role: RoleType): number | null {
  if (/^P\d+$/.test(role)) return Number(role.slice(1));
  if (role === "Neutral" || role === "Shared") return 0;
  return null;
}

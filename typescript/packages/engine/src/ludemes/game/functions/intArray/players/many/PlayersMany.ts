// @java Core/src/game/functions/intArray/players/many/PlayersMany.java

/**
 * Returns an array of player indices matching a PlayersManyType filter.
 *
 * @java game/functions/intArray/players/many/PlayersMany.java
 *
 * Java parity: PlayersMany holds a PlayersManyType, an optional ofFn, and a
 * mandatory cond. eval() returns a TIntArrayList of matching player indices.
 *
 * In the TS 1:1 path the live implementation is PlayersMany1to1 in
 * Players1to1.ts. This class is the faithful standalone transliteration.
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, BooleanFunction, IntFunction } from "../../../../../base.js";
import { BaseIntArrayFunction } from "../../BaseIntArrayFunction.js";
import { PlayersManyType } from "../PlayersManyType.js";

/**
 * @java game.functions.intArray.players.many.PlayersMany
 */
export class PlayersMany extends BaseIntArrayFunction {
  /** @java PlayersMany — private final PlayersManyType team */
  private readonly team: PlayersManyType;

  /** @java PlayersMany — private final IntFunction ofFn */
  private readonly ofFn: IntFunction | null;

  /** @java PlayersMany — private final BooleanFunction cond */
  private readonly cond: BooleanFunction;

  /**
   * @java PlayersMany(PlayersManyType, IntFunction, BooleanFunction)
   * @param playerType The player type to return.
   * @param of         The index of the related player (optional).
   * @param If         The condition to keep the players (required).
   */
  public constructor(
    playerType: PlayersManyType,
    of_: IntFunction | null,
    If: BooleanFunction,
  ) {
    super();
    this.team = playerType;
    this.ofFn = of_;
    this.cond = If;
  }

  /** @java PlayersMany.eval(Context) */
  public override eval(ctx: Context & EvalScratch): number[] {
    const indices: number[] = [];
    const numPlayers = ctx.game.numPlayers;
    const savedPlayer = ctx._evalPlayer;
    const of_ =
      this.ofFn !== null ? this.ofFn.eval(ctx) : ctx.state.mover;

    // If the related player is defined and not a real player return empty.
    if (this.ofFn !== null && (of_ === 0 || of_ >= numPlayers)) {
      ctx._evalPlayer = savedPlayer;
      return indices;
    }

    // Minimal team helpers — TS state does not expose Java's full team API;
    // use valuePlayer (Java's per-player state.getTeam maps to this).
    const requiresTeam = this._requiresTeam(ctx);
    const teamOf = ctx.state.valuePlayer(of_);

    const addIf = (pid: number): void => {
      ctx._evalPlayer = pid;
      if (this.cond.eval(ctx)) indices.push(pid);
    };

    switch (this.team) {
      case PlayersManyType.All:
        // Java iterates 0..numPlayers inclusive.
        for (let pid = 0; pid <= numPlayers; ++pid) addIf(pid);
        break;

      case PlayersManyType.Ally:
        if (requiresTeam) {
          for (let pid = 1; pid < numPlayers; ++pid) {
            if (pid !== of_ && this._playerInTeam(ctx, pid, teamOf)) addIf(pid);
          }
        }
        break;

      case PlayersManyType.Enemy:
        if (requiresTeam) {
          for (let pid = 1; pid < numPlayers; ++pid) {
            if (pid !== ctx.state.mover && !this._playerInTeam(ctx, pid, teamOf)) addIf(pid);
          }
        } else {
          for (let pid = 1; pid < numPlayers; ++pid) {
            if (pid !== of_) addIf(pid);
          }
        }
        break;

      case PlayersManyType.Friend:
        if (requiresTeam) {
          for (let pid = 1; pid < numPlayers; ++pid) {
            if (this._playerInTeam(ctx, pid, teamOf)) addIf(pid);
          }
        } else {
          addIf(of_);
        }
        break;

      case PlayersManyType.NonMover:
        for (let pid = 0; pid < numPlayers; ++pid) {
          if (pid !== ctx.state.mover) addIf(pid);
        }
        break;

      default:
        break;
    }

    ctx._evalPlayer = savedPlayer;
    return indices;
  }

  /** Heuristic: teams are in use if any player has a positive valuePlayer. */
  private _requiresTeam(ctx: Context & EvalScratch): boolean {
    for (let p = 1; p <= ctx.game.numPlayers; p++) {
      if (ctx.state.valuePlayer(p) > 0) return true;
    }
    return false;
  }

  /** @java State.playerInTeam(pid, teamIndex) */
  private _playerInTeam(ctx: Context & EvalScratch, pid: number, teamIndex: number): boolean {
    return teamIndex > 0 && ctx.state.valuePlayer(pid) === teamIndex;
  }

  public override toString(): string {
    return "Players()";
  }
}

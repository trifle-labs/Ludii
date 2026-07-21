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
    // @java PlayersMany.java:64 — numPlayers = players().size() = count+1
    // (includes the null-player slot). Every loop below keeps Java's exact
    // bounds under that convention (All's `<=` even covers the Shared slot
    // at count+1, as Java does).
    const numPlayers = ctx.game.numPlayers + 1;
    const savedPlayer = ctx._evalPlayer;
    const of_ =
      this.ofFn !== null ? this.ofFn.eval(ctx) : ctx.state.mover;

    // If the related player is defined and not a real player return empty.
    if (this.ofFn !== null && (of_ === 0 || of_ >= numPlayers)) {
      ctx._evalPlayer = savedPlayer;
      return indices;
    }

    // @java PlayersMany.java:63 — context.game().requiresTeams(); per-branch
    // teamOf = context.state().getTeam(of). TS team membership lives in
    // game.teamOf (harvested from SetTeam start rules at Game construction).
    const requiresTeam = this._requiresTeam(ctx);
    const teamOfArr = (ctx.game as unknown as { teamOf?: readonly (number | null)[] }).teamOf ?? [];
    const teamOf = teamOfArr[of_] ?? 0;

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

  /**
   * @java Game.requiresTeams() (Game.java:820) — (gameFlags & GameType.Team) != 0;
   * SetTeam.gameFlags() contributes GameType.Team. TS equivalent: game.teamOf
   * (harvested from SetTeam at Game construction) has a non-zero entry.
   */
  private _requiresTeam(ctx: Context & EvalScratch): boolean {
    const teamOf = (ctx.game as unknown as { teamOf?: readonly (number | null)[] }).teamOf ?? [];
    for (let p = 1; p < teamOf.length; p++) if ((teamOf[p] ?? 0) > 0) return true;
    return false;
  }

  /**
   * @java State.playerInTeam(pid, teamIndex) (State.java:1861) — reads
   * State.teams[]; TS reads game.teamOf[pid] from the SetTeam harvest.
   */
  private _playerInTeam(ctx: Context & EvalScratch, pid: number, teamIndex: number): boolean {
    const teamOf = (ctx.game as unknown as { teamOf?: readonly (number | null)[] }).teamOf ?? [];
    return teamIndex > 0 && (teamOf[pid] ?? 0) === teamIndex;
  }

  public override toString(): string {
    return "Players()";
  }
}

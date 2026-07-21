// @java Core/src/game/functions/intArray/players/team/PlayersTeam.java

/**
 * Returns an array of player indices belonging to a given team.
 *
 * @java game/functions/intArray/players/team/PlayersTeam.java
 *
 * Java parity: PlayersTeam holds a PlayersTeamType and a mandatory cond.
 * eval() returns the list of player indices in the named team that satisfy
 * the condition. When teams are not in use and the team index is a valid player
 * number, that single player index is returned.
 *
 * In the TS 1:1 path the live implementation is PlayersTeam1to1 in
 * Players1to1.ts. This class is the faithful standalone transliteration.
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, BooleanFunction } from "../../../../../base.js";
import { BaseIntArrayFunction } from "../../BaseIntArrayFunction.js";
import { PlayersTeamType, playersTeamTypeIndex } from "../PlayersTeamType.js";

/**
 * @java game.functions.intArray.players.team.PlayersTeam
 */
export class PlayersTeam extends BaseIntArrayFunction {
  /** @java PlayersTeam — private final PlayersTeamType team */
  private readonly team: PlayersTeamType;

  /** @java PlayersTeam — private final BooleanFunction cond */
  private readonly cond: BooleanFunction;

  /**
   * @java PlayersTeam(PlayersTeamType, BooleanFunction)
   * @param playerType The team type.
   * @param If         The condition to keep the players (required).
   */
  public constructor(playerType: PlayersTeamType, If: BooleanFunction) {
    super();
    this.team = playerType;
    this.cond = If;
  }

  /** @java PlayersTeam.eval(Context) */
  public override eval(ctx: Context & EvalScratch): number[] {
    const indices: number[] = [];
    // @java PlayersTeam.java:57-58 — numPlayers = players().size() = count+1
    // (includes the null-player slot), so the pid loop covers 1..count. TS
    // game.numPlayers is the COUNT, hence pid <= numPlayers below.
    const numPlayers = ctx.game.numPlayers;
    const teamIndex = playersTeamTypeIndex(this.team);
    const savedPlayer = ctx._evalPlayer;

    // @java PlayersTeam.java:56 — context.game().requiresTeams().
    const requiresTeam = this._requiresTeam(ctx);

    if (requiresTeam) {
      for (let pid = 1; pid <= numPlayers; pid++) {
        ctx._evalPlayer = pid;
        if (this.cond.eval(ctx) && this._playerInTeam(ctx, pid, teamIndex)) {
          indices.push(pid);
        }
      }
    } else if (numPlayers + 1 > teamIndex) {
      // @java PlayersTeam.java:71 — else if (numPlayers > teamIndex) with
      // numPlayers = size() = count+1.
      indices.push(teamIndex);
    }

    ctx._evalPlayer = savedPlayer;
    return indices;
  }

  /**
   * @java Game.requiresTeams() (Game.java:820) — (gameFlags & GameType.Team) != 0;
   * SetTeam.gameFlags() contributes GameType.Team, so any game with
   * (set Team ...) start rules has it. TS equivalent: game.teamOf (harvested
   * from SetTeam at Game construction) has a non-zero entry.
   */
  private _requiresTeam(ctx: Context & EvalScratch): boolean {
    const teamOf = (ctx.game as unknown as { teamOf?: readonly (number | null)[] }).teamOf ?? [];
    for (let p = 1; p < teamOf.length; p++) if ((teamOf[p] ?? 0) > 0) return true;
    return false;
  }

  /**
   * @java State.playerInTeam(pid, teamIndex) (State.java:1861) — reads
   * State.teams[] set by ActionAddPlayerToTeam via SetTeam.eval. TS: reads
   * game.teamOf[pid] set by the SetTeam start-rule harvest.
   */
  private _playerInTeam(ctx: Context & EvalScratch, pid: number, teamIndex: number): boolean {
    const teamOf = (ctx.game as unknown as { teamOf?: readonly (number | null)[] }).teamOf ?? [];
    return teamIndex > 0 && (teamOf[pid] ?? 0) === teamIndex;
  }

  public override toString(): string {
    return "Players()";
  }
}

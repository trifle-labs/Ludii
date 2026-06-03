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
    const numPlayers = ctx.game.numPlayers;
    const teamIndex = playersTeamTypeIndex(this.team);
    const savedPlayer = ctx._evalPlayer;

    // Heuristic: teams are active if any player has a positive valuePlayer.
    const requiresTeam = this._requiresTeam(ctx);

    if (requiresTeam) {
      for (let pid = 1; pid < numPlayers; pid++) {
        ctx._evalPlayer = pid;
        if (this.cond.eval(ctx) && this._playerInTeam(ctx, pid, teamIndex)) {
          indices.push(pid);
        }
      }
    } else if (numPlayers > teamIndex) {
      indices.push(teamIndex);
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

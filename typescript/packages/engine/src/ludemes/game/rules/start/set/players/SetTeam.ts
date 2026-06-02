/**
 * Creates a team of players.
 *
 * @java game/rules/start/set/players/SetTeam.java — eval(Context)
 *
 * DEFERRED: Java ActionAddPlayerToTeam modifies State team membership via Context.
 * The applyToInitialState interface only provides cells/whats/countAt arrays.
 * Team setup cannot be applied until Game1to1.start() exposes a team-membership
 * structure or the StartRule interface is extended.
 * The compile1to1 path currently skips (set Team …) start rules.
 */

import type { Equipment1to1 } from "../../../../equipment/Equipment1to1.js";
import type { StartRule } from "../../StartRule.js";

/**
 * @java game/rules/start/set/players/SetTeam.java
 *
 * Creates a team with the given id and adds the specified players to it.
 * applyToInitialState is a no-op because team membership is not in the interface.
 */
export class SetTeam1to1 implements StartRule {
  /** The 1-based team index. Java: teamIdFn evaluated. */
  private readonly teamId: number;

  /** The 1-based player ids to add to this team. Java: players[] evaluated. */
  private readonly playerIds: readonly number[];

  /**
   * @param teamId     1-based team index
   * @param playerIds  1-based player ids on this team
   */
  public constructor(teamId: number, playerIds: readonly number[]) {
    this.teamId = teamId;
    this.playerIds = playerIds;
  }

  /**
   * @java game/rules/start/set/players/SetTeam.java — eval(Context)
   *
   * Java: for each player in players: ActionAddPlayerToTeam(teamId, playerIndex).apply(context)
   * TS-deferred: team membership not accessible via applyToInitialState interface.
   */
  public applyToInitialState(
    _cells: number[],
    _whats: number[],
    _countAt: number[],
    _equipment: Equipment1to1,
    _numPlayers: number,
  ): void {
    // Deferred: State team membership not accessible via applyToInitialState.
    // Java: new ActionAddPlayerToTeam(teamId, playerIndex).apply(context) for each player.
    void this.teamId;
    void this.playerIds;
  }
}

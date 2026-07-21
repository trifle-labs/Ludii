/**
 * Creates a team of players.
 *
 * @java game/rules/start/set/players/SetTeam.java — eval(Context)
 *
 * DEFERRED: Java ActionAddPlayerToTeam modifies State team membership via Context.
 * The applyToInitialState interface only provides cells/whats/countAt arrays.
 * Team setup cannot be applied until Game.start() exposes a team-membership
 * structure or the StartRule interface is extended.
 * The compile1to1 path currently skips (set Team …) start rules.
 */

import type { EquipmentSurface } from "../../../../equipment/EquipmentSurface.js";
import type { Context } from "../../../../../../context.js";
import type { StartRule } from "../../StartRule.js";

/**
 * @java game/rules/start/set/players/SetTeam.java
 *
 * Creates a team with the given id and adds the specified players to it.
 * applyToInitialState is a no-op because team membership is not in the interface.
 */
export class SetTeam implements StartRule {
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
  public eval(_ctx: Context): void {
    // Team membership is harvested statically at Game construction (Game.teamOf)
    // by scanning the SetTeam start rules — these `(set Team …)` rules are fixed
    // at game start. eval/applyToInitialState remain no-ops on the array-only
    // start interface; the harvest reads team()/players() directly.
    void this.teamId;
  }

  /** @java SetTeam.teamId — the 1-based team index. */
  public team(): number {
    return this.teamId;
  }

  /** @java SetTeam.players — the 1-based player ids on this team. */
  public players(): readonly number[] {
    return this.playerIds;
  }
}

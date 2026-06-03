// @java Core/src/game/rules/play/moves/nonDecision/effect/set/team/SetTeam.java

/**
 * Sets a team by assigning player roles to a team index.
 *
 * @java game/rules/play/moves/nonDecision/effect/set/team/SetTeam.java
 *
 * Java parity (SetTeam.eval):
 *   1. Evaluate the team ID.
 *   2. For each player in the roles array, emit ActionAddPlayerToTeam.
 *   3. All actions go into a single Move.
 *
 * NOTE: coverage-only transliteration; not registered in the 1:1 moves registry.
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { IntFunction, MovesFunction } from "../../../../../../../../base.js";
import { ActionAddPlayerToTeam } from "../../../../../../../../../action/action-add-player-to-team.js";
import { Move as LudiiMove } from "../../../../../../../../../move.js";

/** @java game/types/play/RoleType.java — minimal subset */
export type RoleType = string;

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * @java game/rules/play/moves/nonDecision/effect/set/team/SetTeam.java
 *
 * Java parity:
 *   public final class SetTeam extends Effect
 *   eval(Context): emit ActionAddPlayerToTeam for each player in the team.
 */
export class SetTeam implements MovesFunction {
  /** The team index. @java SetTeam.teamIdFn */
  private readonly teamIdFn: IntFunction;

  /** Functions evaluating each player index. @java SetTeam.players */
  private readonly playerFns: IntFunction[];

  /** The role types (for validation). @java SetTeam.roles */
  private readonly roles: RoleType[];

  /** Optional subsequent moves. */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java SetTeam(IntFunction team, RoleType[] roles, Then then)
   * @param teamIdFn   The team index.
   * @param roles      RoleType for each team member.
   * @param thenMoves  Optional subsequent moves.
   */
  public constructor(
    teamIdFn: IntFunction,
    roles: RoleType[],
    thenMoves: MovesFunction | null = null,
  ) {
    this.teamIdFn = teamIdFn;
    this.roles = roles;
    // Convert RoleType[] to IntFunction[] matching Java's RoleType.toIntFunction.
    this.playerFns = roles.map((role) => this._roleToIntFn(role));
    this.thenMoves = thenMoves;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/set/team/SetTeam.java — eval(Context)
   *
   * Java parity (SetTeam.eval lines 75-109):
   *   1. Evaluate teamId.
   *   2. For each player role, emit ActionAddPlayerToTeam if the index is valid.
   *   3. All actions in one Move.
   */
  public eval(ctx: Context): Move[] {
    const mover = ctx.state.mover;
    const teamId = this.teamIdFn.eval(ctx);
    const numPlayers = this._numPlayers(ctx);
    const actions: import("../../../../../../../../../action/action.js").Action[] = [];

    for (const playerFn of this.playerFns) {
      const playerIndex = playerFn.eval(ctx);
      // Java parity: ignore player indices that are not real players.
      if (playerIndex < 1 || playerIndex > numPlayers) continue;
      actions.push(new ActionAddPlayerToTeam(teamId, playerIndex));
    }

    if (actions.length === 0) {
      return [];
    }

    const move = new LudiiMove({
      id: "setTeam",
      label: `setTeam:${teamId}`,
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions,
      fromSite: OFF,
      toSite: OFF,
    });

    const thenList: Move[] = this.thenMoves != null ? this.thenMoves.eval(ctx) : [];
    if (thenList.length === 0) {
      return [move];
    }

    const withThen = new LudiiMove({
      id: "setTeam",
      label: `setTeam:${teamId}`,
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions,
      then: thenList,
      fromSite: OFF,
      toSite: OFF,
    });
    return [withThen];
  }

  /** Convert a RoleType string to an IntFunction. */
  private _roleToIntFn(role: RoleType): IntFunction {
    return {
      eval: (ctx: Context) => {
        switch (role) {
          case "Mover": return ctx.state.mover;
          case "Next": return (ctx.state as unknown as { next: number }).next ?? ctx.state.mover;
          case "Prev": return (ctx.state as unknown as { prev: number }).prev ?? ctx.state.mover;
          default: {
            const m = role.match(/^P(\d+)$/);
            return m ? parseInt(m[1]!, 10) : ctx.state.mover;
          }
        }
      },
    };
  }

  /** Helper: get the number of players. */
  private _numPlayers(ctx: Context): number {
    const gameAny = ctx.game as unknown as { players?: { count?: number } };
    return gameAny.players?.count ?? 2;
  }

  /** @java SetTeam.isStatic() → false */
  public isStatic(): boolean {
    return false;
  }

  /** @java SetTeam.toEnglish() */
  public toEnglish(): string {
    return "set team";
  }
}

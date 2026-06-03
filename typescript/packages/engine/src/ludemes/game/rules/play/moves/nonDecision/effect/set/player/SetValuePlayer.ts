// @java Core/src/game/rules/play/moves/nonDecision/effect/set/player/SetValuePlayer.java

/**
 * Sets the value associated with a player.
 *
 * @java game/rules/play/moves/nonDecision/effect/set/player/SetValuePlayer.java
 *
 * Java parity (SetValuePlayer.eval):
 *   1. Evaluate the player ID and the value.
 *   2. If the player index is out of range, return no moves.
 *   3. Emit ActionSetValueOfPlayer(pid, value) wrapped in a single Move.
 *
 * NOTE: coverage-only transliteration; not registered in the 1:1 moves registry.
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { IntFunction, MovesFunction } from "../../../../../../../../base.js";
import { ActionSetValueOfPlayer } from "../../../../../../../../../action/action-set-value-of-player.js";
import { Move as LudiiMove } from "../../../../../../../../../move.js";

/** @java game/types/play/RoleType.java — minimal subset */
export type RoleType = string;

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * @java game/rules/play/moves/nonDecision/effect/set/player/SetValuePlayer.java
 *
 * Java parity:
 *   public final class SetValuePlayer extends Effect
 *   eval(Context): emit ActionSetValueOfPlayer(pid, value).
 */
export class SetValuePlayer implements MovesFunction {
  /** Player index function. @java SetValuePlayer.playerId */
  private readonly playerIdFn: IntFunction;

  /** Value function. @java SetValuePlayer.valueFn */
  private readonly valueFn: IntFunction;

  /** Optional subsequent moves. */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java SetValuePlayer(Player player, RoleType role, IntFunction value, Then then)
   *
   * @param playerFn   Function yielding the player index (or null if role is used).
   * @param role       RoleType for the player (or null if playerFn is used).
   * @param valueFn    The value to set.
   * @param thenMoves  Optional subsequent moves.
   */
  public constructor(
    playerFn: IntFunction | null,
    role: RoleType | null,
    valueFn: IntFunction,
    thenMoves: MovesFunction | null = null,
  ) {
    // Java parity: if player != null → player.index(); else → RoleType.toIntFunction(role)
    if (playerFn != null) {
      this.playerIdFn = playerFn;
    } else {
      this.playerIdFn = this._roleToIntFn(role ?? "Mover");
    }
    this.valueFn = valueFn;
    this.thenMoves = thenMoves;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/set/player/SetValuePlayer.java — eval(Context)
   *
   * Java parity (SetValuePlayer.eval lines 68-93):
   *   1. Evaluate pid and value.
   *   2. If pid is out of range (< 0 or > numPlayers), return empty.
   *   3. Emit ActionSetValueOfPlayer(pid, value) in a Move.
   */
  public eval(ctx: Context): Move[] {
    const mover = ctx.state.mover;
    const pid = this.playerIdFn.eval(ctx);
    const value = this.valueFn.eval(ctx);
    const numPlayers = this._numPlayers(ctx);

    // Java parity: if (pid < 0 || pid > game.players().count()) return moves;
    if (pid < 0 || pid > numPlayers) {
      return [];
    }

    const action = new ActionSetValueOfPlayer(pid, value);
    const move = new LudiiMove({
      id: "setValuePlayer",
      label: `setValuePlayer:P${pid}=${value}`,
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions: [action],
      fromSite: OFF,
      toSite: OFF,
    });

    const thenList: Move[] = this.thenMoves != null ? this.thenMoves.eval(ctx) : [];
    if (thenList.length === 0) {
      return [move];
    }

    const withThen = new LudiiMove({
      id: "setValuePlayer",
      label: `setValuePlayer:P${pid}=${value}`,
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions: [action],
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

  /** @java SetValuePlayer.isStatic() → false */
  public isStatic(): boolean {
    return false;
  }

  /** @java SetValuePlayer.toEnglish() */
  public toEnglish(): string {
    return "set the value of Player";
  }
}

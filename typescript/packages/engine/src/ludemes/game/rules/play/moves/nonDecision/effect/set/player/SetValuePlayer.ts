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
import { applyPostStateThen } from "../../Then.js";

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

    // @java Move.apply evaluates then() AFTER the action — defer, don't bake.
    return [applyPostStateThen(this.thenMoves, ctx, move)];
  }

  /** Convert a RoleType string to an IntFunction. */
  private _roleToIntFn(role: RoleType): IntFunction {
    return {
      eval: (ctx: Context) => {
        switch (role) {
          case "Mover": return ctx.state.mover;
          // @java context.state().next() — TS states carry next=0 until the
          // cycle finalises, so a raw read resolved Next to player 0 inside
          // deferred thens (Annuvin's capture bumped nobody's move points).
          // Rotational fallback like NextFn.ts.
          case "Next": {
            const rawNext = (ctx.state as unknown as { next?: number }).next ?? 0;
            if (rawNext > 0) return rawNext;
            const np = (ctx.game as unknown as { numPlayers?: number }).numPlayers ?? 2;
            return (ctx.state.mover % np) + 1;
          }
          case "Prev": {
            const rawPrev = (ctx.state as unknown as { prev?: number }).prev ?? 0;
            if (rawPrev > 0) return rawPrev;
            return ctx.state.mover;
          }
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
    // @java context.game().players().count(). In the 1:1 port game.players is
    // the compiled Players LUDEME (a function), so `.count` was undefined and
    // this always returned 2 — the pid>numPlayers guard then rejected every
    // (set Value Mover …) for player 3+ in 4-/6-player race games (Petol,
    // Asi Keliya), so their consecutive-turn moveAgain never fired and the
    // mover drifted. numPlayers is the established numeric accessor.
    const n = (ctx.game as unknown as { numPlayers?: number }).numPlayers;
    return typeof n === "number" && n > 0 ? n : 2;
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

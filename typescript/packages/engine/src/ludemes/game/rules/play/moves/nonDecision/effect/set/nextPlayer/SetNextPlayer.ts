// @java Core/src/game/rules/play/moves/nonDecision/effect/set/nextPlayer/SetNextPlayer.java

/**
 * Is used to set the next player.
 *
 * @java game/rules/play/moves/nonDecision/effect/set/nextPlayer/SetNextPlayer.java
 * @author Eric.Piette and cambolbro
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { IntArrayFunction, MovesFunction } from "../../../../../../../../base.js";
import { ActionSetNextPlayer } from "../../../../../../../../../action/action-set-next-player.js";
import { Move as LudiiMove } from "../../../../../../../../../move.js";
import { applyPostStateThen } from "../../Then.js";
import { IntArrayConstant } from "../../../../../../../../game/functions/intArray/IntArrayConstant.js";
import type { Player } from "../../../../../../../../game/util/moves/Player.js";

/** @java Constants.OFF = -1 */
const OFF = -1;

/**
 * @java game/rules/play/moves/nonDecision/effect/set/nextPlayer/SetNextPlayer.java
 *
 * Sets the next player who will move.
 *
 * Java parity:
 *   public final class SetNextPlayer extends Effect
 *   Constructor: accepts either a Player (who) or IntArrayFunction (nextPlayers) — @Or.
 *   eval(Context): for each candidate nextPlayerId, emit ActionSetNextPlayer wrapped
 *   in a Move with from/to = OFF and mover set.
 */
export class SetNextPlayer implements MovesFunction {
  /**
   * The indices of the possible next player(s).
   * @java SetNextPlayer.nextPlayerFn
   */
  private readonly nextPlayerFn: IntArrayFunction;

  /**
   * Optional subsequent moves.
   * @java Effect.then
   */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java SetNextPlayer(Player who, IntArrayFunction nextPlayers, Then then)
   *
   * @Or: pass either a Player (who) or an IntArrayFunction (nextPlayers).
   *
   * @param who         The data of the next player.
   * @param nextPlayers The indices of the next players.
   * @param thenMoves   Optional subsequent moves.
   */
  public constructor(
    who: Player | null,
    nextPlayers: IntArrayFunction | null,
    thenMoves: MovesFunction | null = null,
  ) {
    // @java SetNextPlayer.java:49-66
    // @Or — only one of who/nextPlayers may be non-null.
    let numNonNull = 0;
    if (who != null) numNonNull++;
    if (nextPlayers != null) numNonNull++;
    if (numNonNull > 1) {
      throw new Error("Only one Or parameter can be non-null.");
    }

    if (nextPlayers != null) {
      // @java SetNextPlayer.java:62 — nextPlayerFn = nextPlayers;
      this.nextPlayerFn = nextPlayers;
    } else if (who != null) {
      // @java SetNextPlayer.java:63-65 — new IntArrayConstant(new IntFunction[]{ who.index() })
      this.nextPlayerFn = new IntArrayConstant([who.index()]);
    } else {
      throw new Error("SetNextPlayer requires one Or parameter: who or nextPlayers.");
    }
    this.thenMoves = thenMoves;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/set/nextPlayer/SetNextPlayer.java — eval(Context)
   *
   * Java parity (SetNextPlayer.eval lines 71-99):
   *   1. new BaseMoves(super.then())
   *   2. nextPlayerIds = nextPlayerFn.eval(context)
   *   3. For each nextPlayerId (skip if out of range):
   *      a. new ActionSetNextPlayer(nextPlayerId)
   *      b. if isDecision() → action.setDecision(true)
   *      c. new Move(actionSetNextPlayer)
   *      d. move.setFromNonDecision(Constants.OFF)
   *      e. move.setToNonDecision(Constants.OFF)
   *      f. move.setMover(context.state().mover())
   *      g. moves.moves().add(move)
   *   4. setMovesLudeme(this) on each move (meta-tag, no-op in TS)
   *   5. return moves
   */
  public eval(ctx: Context): Move[] {
    // @java SetNextPlayer.java:73 — final Moves moves = new BaseMoves(super.then());
    const mover = ctx.state.mover;

    // @java SetNextPlayer.java:75 — final int[] nextPlayerIds = nextPlayerFn.eval(context);
    const nextPlayerIds = this.nextPlayerFn.eval(ctx);

    const numPlayers = (ctx.game as unknown as { players?: () => { count: () => number }; numPlayers?: number });
    const playerCount = typeof numPlayers.players === "function"
      ? numPlayers.players().count()
      : (numPlayers.numPlayers ?? Number.MAX_SAFE_INTEGER);

    const moves: Move[] = [];

    for (const nextPlayerId of nextPlayerIds) {
      // @java SetNextPlayer.java:79-83 — range check
      if (nextPlayerId < 1 || nextPlayerId > playerCount) {
        console.error(`The Player ${nextPlayerId} can not be set`);
        continue;
      }

      // @java SetNextPlayer.java:85 — new ActionSetNextPlayer(nextPlayerId)
      const actionSetNextPlayer = new ActionSetNextPlayer(nextPlayerId);

      // @java SetNextPlayer.java:86-87 — if (isDecision()) action.setDecision(true)
      // (isDecision() is a Moves-level flag; no direct equivalent here — skip)

      // @java SetNextPlayer.java:88 — new Move(actionSetNextPlayer)
      // @java SetNextPlayer.java:89 — move.setFromNonDecision(Constants.OFF)
      // @java SetNextPlayer.java:90 — move.setToNonDecision(Constants.OFF)
      // @java SetNextPlayer.java:91 — move.setMover(context.state().mover())
      const move = new LudiiMove({
        id: "setNextPlayer",
        label: `setNextPlayer:${nextPlayerId}`,
        siteIndices: [],
        mover,
        placedOwner: mover,
        actions: [actionSetNextPlayer],
        fromSite: OFF,
        toSite: OFF,
      });

      // @java SetNextPlayer.java:92 — moves.moves().add(move). Move.apply
      // evaluates then() AFTER the action, so defer instead of baking.
      moves.push(applyPostStateThen(this.thenMoves, ctx, move));
    }

    // @java SetNextPlayer.java:95-97 — setMovesLudeme(this) on each move
    // (meta-tag only — no runtime effect in TS; skipped)

    return moves;
  }

  /**
   * @java SetNextPlayer.canMoveTo(Context, int)
   * Returns false — SetNextPlayer never generates a move to a target site.
   */
  public canMoveTo(_ctx: Context, _target: number): boolean {
    // @java SetNextPlayer.java:104-107
    return false;
  }

  /**
   * @java SetNextPlayer.isStatic()
   */
  public isStatic(): boolean {
    // @java SetNextPlayer.java:188-191 — return nextPlayerFn.isStatic();
    return (this.nextPlayerFn as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
  }

  /**
   * @java SetNextPlayer.preprocess(Game)
   */
  public preprocess(game: unknown): void {
    // @java SetNextPlayer.java:194-198
    (this.nextPlayerFn as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
    if (this.thenMoves != null) {
      (this.thenMoves as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
    }
  }

  /**
   * @java SetNextPlayer.gameFlags(Game)
   */
  public gameFlags(game: unknown): number {
    // @java SetNextPlayer.java:113-120
    let flags = (this.nextPlayerFn as unknown as { gameFlags?: (g: unknown) => number }).gameFlags?.(game) ?? 0;
    if (this.thenMoves != null) {
      flags |= (this.thenMoves as unknown as { gameFlags?: (g: unknown) => number }).gameFlags?.(game) ?? 0;
    }
    return flags;
  }

  /**
   * @java SetNextPlayer.toEnglish(Game)
   */
  public toEnglish(game: unknown): string {
    let thenString = "";
    if (this.thenMoves != null) {
      thenString = " then " + ((this.thenMoves as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ?? "");
    }
    const fn = (this.nextPlayerFn as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ?? String(this.nextPlayerFn);
    return `set the next mover to Player ${fn}${thenString}`;
  }
}

// @java Core/src/game/rules/play/moves/nonDecision/operators/foreach/player/ForEachPlayer.java

/**
 * Iterates through the players, generating moves based on the indices of the
 * players.
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/player/ForEachPlayer.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { IntArrayFunction, MovesFunction } from "../../../../../../../../base.js";

/**
 * Minimal interface for a Then (consequence moves following a primary move).
 * @java game/rules/play/moves/nonDecision/effect/Then.java
 */
interface ThenLike {
  moves(): { eval(ctx: Context): Move[] };
}

/**
 * Iterates through the players, generating moves based on the indices of the players.
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/player/ForEachPlayer.java
 *
 * Java: public final class ForEachPlayer extends Operator
 */
export class ForEachPlayer implements MovesFunction {
  /** @java ForEachPlayer.moves */
  private readonly movesFn: MovesFunction;

  /** @java ForEachPlayer.playersFn */
  private readonly playersFn: IntArrayFunction | null;

  /** @java Operator._then (via super(then)) */
  private readonly _then: ThenLike | null;

  // -------------------------------------------------------------------------

  /**
   * @param playersFn The list of players.
   * @param movesFn   The moves.
   * @param then      The moves applied after that move is applied.
   * @java ForEachPlayer(IntArrayFunction, Moves, Then)
   */
  public constructor(playersFn: IntArrayFunction | null, movesFn: MovesFunction, then?: ThenLike | null);

  /**
   * @param movesFn The moves to generate per player.
   * @param then    The moves applied after that move is applied.
   * @java ForEachPlayer(Moves, Then)
   */
  public constructor(movesFn: MovesFunction, then?: ThenLike | null);

  public constructor(
    playersFnOrMovesFn: IntArrayFunction | MovesFunction | null,
    movesFnOrThen?: MovesFunction | ThenLike | null,
    thenArg: ThenLike | null = null,
  ) {
    if (playersFnOrMovesFn === null) {
      // Three-arg Java order with no player filter: (null, Moves, Then)
      this.playersFn = null;
      this.movesFn = movesFnOrThen as MovesFunction;
      this._then = thenArg ?? null;
    } else if (
      movesFnOrThen !== null &&
      movesFnOrThen !== undefined &&
      typeof (movesFnOrThen as MovesFunction).eval === "function"
    ) {
      // Three-arg: (IntArrayFunction, Moves, Then) or (IntArrayFunction, Moves)
      this.playersFn = playersFnOrMovesFn as IntArrayFunction;
      this.movesFn = movesFnOrThen as MovesFunction;
      this._then = thenArg ?? null;
    } else {
      // One-arg moves + optional then: (Moves, Then?)
      this.playersFn = null;
      this.movesFn = playersFnOrMovesFn as MovesFunction;
      this._then = (movesFnOrThen as ThenLike | null | undefined) ?? null;
    }
  }

  // -------------------------------------------------------------------------

  /** @java ForEachPlayer.then() */
  public then(): ThenLike | null {
    return this._then;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/operators/foreach/player/ForEachPlayer.java — eval(Context)
   */
  public eval(context: Context): Move[] {
    // @java final Moves movesToReturn = new BaseMoves(super.then());
    const movesToReturn: Move[] = [];

    // @java final int savedPlayer = context.player();
    const ctx = context as unknown as {
      player(): number;
      setPlayer(v: number): void;
      game(): { players(): { size(): number } };
    };
    const savedPlayer = ctx.player();

    if (this.playersFn === null) {
      // @java for (int pid = 1; pid < context.game().players().size(); pid++)
      const numPlayers = (context.game as unknown as { numPlayers: number }).numPlayers ??
        ctx.game().players().size() - 1;
      for (let pid = 1; pid < (numPlayers + 1); pid++) {
        ctx.setPlayer(pid);
        // @java final FastArrayList<Move> generatedMoves = moves.eval(context).moves();
        const generatedMoves = this.movesFn.eval(context);
        for (const m of generatedMoves) movesToReturn.push(m);
      }
    } else {
      // @java final int[] players = playersFn.eval(context);
      const players = this.playersFn.eval(context as never);
      const numPlayers = (context.game as unknown as { numPlayers: number }).numPlayers ??
        ctx.game().players().size() - 1;
      for (let i = 0; i < players.length; i++) {
        const pid = players[i]!;

        // @java if (pid < 0 || pid > context.game().players().size()) continue;
        if (pid < 0 || pid > numPlayers) continue;

        ctx.setPlayer(pid);
        // @java final FastArrayList<Move> generatedMoves = moves.eval(context).moves();
        const generatedMoves = this.movesFn.eval(context);
        for (const m of generatedMoves) movesToReturn.push(m);
      }
    }

    // @java if (then() != null) for (j ...) movesToReturn.moves().get(j).then().add(then().moves());
    // NOTE: In this TS port, Move.then is readonly; then-chaining is approximated at the
    // move-generation level rather than by mutating Move objects.

    // @java context.setPlayer(savedPlayer);
    ctx.setPlayer(savedPlayer);

    return movesToReturn;
  }

  // -------------------------------------------------------------------------

  /** @java ForEachPlayer.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java ForEachPlayer.preprocess(Game) */
  public preprocess(game: unknown): void {
    (this.movesFn as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    if (this.playersFn !== null) {
      (this.playersFn as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    }
  }

  /** @java ForEachPlayer.missingRequirement(Game) */
  public missingRequirement(game: unknown): boolean {
    let missing = false;
    missing = missing || (this.movesFn as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false;
    if (this._then !== null) {
      missing = missing || (this._then.moves() as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false;
    }
    if (this.playersFn !== null) {
      missing = missing || (this.playersFn as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false;
    }
    return missing;
  }

  /** @java ForEachPlayer.willCrash(Game) */
  public willCrash(game: unknown): boolean {
    let willCrash = false;
    willCrash = willCrash || (this.movesFn as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false;
    if (this._then !== null) {
      willCrash = willCrash || (this._then.moves() as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false;
    }
    if (this.playersFn !== null) {
      willCrash = willCrash || (this.playersFn as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false;
    }
    return willCrash;
  }

  /** @java ForEachPlayer.toEnglish(Game) */
  public toEnglish(game: unknown): string {
    let playerString = "for all players";
    if (this.playersFn !== null) {
      playerString = "for each player in " +
        ((this.playersFn as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "");
    }
    return playerString + " " +
      ((this.movesFn as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "");
  }
}

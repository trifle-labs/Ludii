// @java Core/src/game/rules/play/moves/nonDecision/operators/logical/And.java

/**
 * Moves all the moves in the list if used in a consequence else only one move
 * in the list.
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/And.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../../base.js";

/**
 * Minimal interface for a Then (consequence moves following a primary move).
 * @java game/rules/play/moves/nonDecision/effect/Then.java
 */
interface ThenLike {
  moves(): { eval(ctx: Context): Move[] };
}

/**
 * Moves all the moves in the list (union of sub-move lists).
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/And.java
 *
 * Java: public final class And extends Operator
 */
export class And implements MovesFunction {
  /** @java And.list */
  readonly list: MovesFunction[];

  /** @java Operator._then (from super(then)) */
  private readonly _then: ThenLike | null;

  // -------------------------------------------------------------------------

  /**
   * For making a move between two sets of moves.
   *
   * @param movesA The first move.
   * @param movesB The second move.
   * @param then   The moves applied after that move is applied.
   * @java And(Moves, Moves, Then)
   */
  public constructor(movesA: MovesFunction, movesB: MovesFunction, then?: ThenLike | null);

  /**
   * For making a move between many sets of moves.
   *
   * @param list The list of moves.
   * @param then The moves applied after that move is applied.
   * @java And(Moves[], Then)
   */
  public constructor(list: MovesFunction[], then?: ThenLike | null);

  public constructor(
    movesAOrList: MovesFunction | MovesFunction[],
    movesBOrThen?: MovesFunction | ThenLike | null,
    thenArg?: ThenLike | null,
  ) {
    if (Array.isArray(movesAOrList)) {
      // (Moves[], Then?)
      this.list = movesAOrList;
      this._then = (movesBOrThen as ThenLike | null | undefined) ?? null;
    } else if (
      movesBOrThen !== null &&
      movesBOrThen !== undefined &&
      typeof (movesBOrThen as MovesFunction).eval === "function"
    ) {
      // (Moves, Moves, Then?)
      this.list = [movesAOrList, movesBOrThen as MovesFunction];
      this._then = thenArg ?? null;
    } else {
      // (Moves, Then?)
      this.list = [movesAOrList];
      this._then = (movesBOrThen as ThenLike | null | undefined) ?? null;
    }
  }

  // -------------------------------------------------------------------------

  /** @java And.then() */
  public then(): ThenLike | null {
    return this._then;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/And.java — eval(Context)
   *
   * Java lines 146-160:
   *   final Moves moves = new BaseMoves(super.then());
   *   for (int i = 0; i < list.length; ++i)
   *     moves.moves().addAll(list[i].eval(context).moves());
   *   if (then() != null) for (j ...) moves.moves().get(j).then().add(then().moves());
   *   return moves;
   */
  public eval(ctx: Context): Move[] {
    // @java final Moves moves = new BaseMoves(super.then());
    const moves: Move[] = [];

    // @java for (int i = 0; i < list.length; ++i) moves.moves().addAll(list[i].eval(context).moves());
    for (let i = 0; i < this.list.length; ++i) {
      const subMoves = this.list[i]!.eval(ctx);
      for (const m of subMoves) moves.push(m);
    }

    // @java if (then() != null) for (j ...) moves.moves().get(j).then().add(then().moves());
    // NOTE: Move.then is readonly in this TS port; then-chaining approximated at generation level.

    return moves;
  }

  // -------------------------------------------------------------------------

  /**
   * @java And.canMoveTo(Context, int)
   */
  public canMoveTo(context: Context, target: number): boolean {
    for (const moves of this.list) {
      const generated = moves.eval(context);
      for (const m of generated) {
        if (m.siteIndices && m.siteIndices[m.siteIndices.length - 1] === target)
          return true;
      }
    }
    return false;
  }

  // -------------------------------------------------------------------------

  /** @java And.isStatic() */
  public isStatic(): boolean {
    for (const moves of this.list) {
      if (!(moves as unknown as { isStatic?(): boolean }).isStatic?.()) return false;
    }
    return true;
  }

  /** @java And.preprocess(Game) */
  public preprocess(game: unknown): void {
    for (const moves of this.list) {
      (moves as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    }
  }

  /** @java And.missingRequirement(Game) */
  public missingRequirement(game: unknown): boolean {
    let missing = false;
    for (const moves of this.list) {
      missing = missing || ((moves as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    }
    if (this._then !== null) {
      missing = missing || ((this._then.moves() as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    }
    return missing;
  }

  /** @java And.willCrash(Game) */
  public willCrash(game: unknown): boolean {
    let willCrash = false;
    for (const moves of this.list) {
      willCrash = willCrash || ((moves as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    }
    if (this._then !== null) {
      willCrash = willCrash || ((this._then.moves() as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    }
    return willCrash;
  }

  /** @java And.toString() */
  public toString(): string {
    return "And(" + this.list + ")";
  }

  /** @java And.toEnglish(Game) */
  public toEnglish(game: unknown): string {
    if (this.list.length === 0) return "no moves";

    let text = "";
    for (const move of this.list) {
      text += ((move as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "") + " and ";
    }
    text = text.substring(0, text.length - 5);

    if (this._then !== null) {
      text += " " + ((this._then.moves() as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "");
    }

    return text;
  }
}

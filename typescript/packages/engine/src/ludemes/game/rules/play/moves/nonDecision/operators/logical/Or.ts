// @java Core/src/game/rules/play/moves/nonDecision/operators/logical/Or.java

/**
 * Moves one of the moves in the list.
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/Or.java
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
 * Moves one of the moves in the list (union — player chooses one).
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/Or.java
 *
 * Java: public final class Or extends Operator
 */
export class Or implements MovesFunction {
  /** @java Or.list */
  readonly list: MovesFunction[];

  /** @java Operator._then (from super(then)) */
  private readonly _then: ThenLike | null;

  // -------------------------------------------------------------------------

  /**
   * @java Or(Moves movesA, Moves movesB, @Opt Then then)
   * @java Or(Moves[] list, @Opt Then then)
   */
  public constructor(
    movesA: MovesFunction | MovesFunction[],
    movesB?: MovesFunction | ThenLike | null,
    then?: ThenLike | null,
  ) {
    if (Array.isArray(movesA)) {
      // (Moves[], Then?)
      if (then !== null && then !== undefined)
        throw new Error("Or requires Java constructor arguments (Moves, Moves, Then?) or (Moves[], Then?).");
      this.list = movesA;
      this._then = (movesB as ThenLike | null | undefined) ?? null;
    } else if (
      movesB !== null &&
      movesB !== undefined &&
      typeof (movesB as MovesFunction).eval === "function"
    ) {
      // (Moves, Moves, Then?)
      this.list = [movesA, movesB as MovesFunction];
      this._then = then ?? null;
    } else {
      throw new Error("Or requires Java constructor arguments (Moves, Moves, Then?) or (Moves[], Then?).");
    }
  }

  // -------------------------------------------------------------------------

  /** @java Or.then() */
  public then(): ThenLike | null {
    return this._then;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/Or.java — eval(Context)
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
   * @java Or.canMoveTo(Context, int)
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

  /** @java Or.isStatic() */
  public isStatic(): boolean {
    for (const moves of this.list) {
      if (!(moves as unknown as { isStatic?(): boolean }).isStatic?.()) return false;
    }
    return true;
  }

  /** @java Or.preprocess(Game) */
  public preprocess(game: unknown): void {
    for (const moves of this.list) {
      (moves as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    }
  }

  /** @java Or.missingRequirement(Game) */
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

  /** @java Or.willCrash(Game) */
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

  /** @java Or.toString() */
  public toString(): string {
    return "Or(" + this.list + ")";
  }

  /** @java Or.toEnglish(Game) */
  public toEnglish(game: unknown): string {
    if (this.list.length === 0) return "no moves";

    let text = "";
    for (const move of this.list) {
      text += ((move as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "") + " or ";
    }
    text = text.substring(0, text.length - 4);

    if (this._then !== null) {
      text += " " + ((this._then.moves() as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "");
    }

    return text;
  }
}

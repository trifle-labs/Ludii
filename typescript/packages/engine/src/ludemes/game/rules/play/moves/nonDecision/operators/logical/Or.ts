// @java Core/src/game/rules/play/moves/nonDecision/operators/logical/Or.java

/**
 * Moves one of the moves in the list.
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/Or.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../../../context.js";
import { applyPostStateThen } from "../../effect/Then.js";
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
    movesB: MovesFunction | ThenLike | null = null,
    then: ThenLike | null = null,
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

    // @java Or.java:155-158 — the ludeme's own (then …) is added to every
    // generated move's then() list (deferred to apply time).
    const ownThen = this.then();
    if (ownThen !== null) {
      return moves.map((m) => applyPostStateThen(ownThen, ctx, m));
    }
    return moves;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Or.java:74-141 — movesIterator(Context)/canMoveConditionally(...)
   *
   * Java's `Or` has no `canMove(Context)` override of its own — it inherits
   * the base `Moves.canMove()`, which in Java is
   * `movesIterator(context).canMoveConditionally(predicate)`. Crucially,
   * `Or` DOES override `movesIterator()`, and its custom iterator's
   * `canMoveConditionally()` (Or.java:122-138) is genuinely lazy: it tries
   * list entries strictly in order, stopping at the FIRST entry whose own
   * `canMoveConditionally(predicate)` succeeds, and never visits later
   * entries at all if an earlier one does:
   *
   *   while (true) {
   *     if (itr.canMoveConditionally(predicate)) return true;
   *     if (list.length <= listIdx) return false;
   *     itr = list[listIdx++].movesIterator(context);
   *   }
   *
   * WAVE-16 LAZY-CANMOVE FIX: TS's `Or` previously had no `canMove()`
   * override either, but TS's base `Moves.canMove()` default is
   * `this.eval(ctx).length > 0` (not a lazy iterator) — and `Or.eval()`
   * unions EVERY list entry's eval() unconditionally. That evaluated (and
   * fired the side effects of) every branch, not just the first
   * non-empty/predicate-passing one. This override restores Java's
   * first-branch-wins short-circuit directly: delegate to each entry's own
   * polymorphic `canMove()` (or eval().length>0 for a leaf ludeme with no
   * override, matching Java's own base-class default) in list order,
   * stopping at the first one that returns true.
   *
   * NOTE (wave16 verification): wave15's fenix-suffragetto-open.md, Target
   * 2, attributed Suffragetto's java-ply-254 RNG desync to exactly this gap
   * (this `Or`'s list being `[(if mover=P1 (MoveHop ...) (MoveHop ...)),
   * (move Pass)]`). Instrumented side-by-side SitesRandom-draw traces
   * (java-side dump4_252_255.log vs TS SR_TRACE) show the two are ALREADY
   * byte-identical at that ply (call-sequence regionLen 20,20,21,20 on both
   * sides) — that specific desync was already closed by commit 42158a431e
   * ("Suffragetto Pass-path stalemated probe on the REAL rng"), which
   * predates this change. This `canMove()` override is still a correct,
   * faithful port of Java's Or semantics (kept for general correctness /
   * other call sites), but it does NOT move Suffragetto's current
   * ply-2761 MOVE_MISMATCH — confirmed byte-identical replay output with
   * and without this fix. See wave16 validation notes.
   */
  public canMove(ctx: Context): boolean {
    for (const moveGen of this.list) {
      const fn = moveGen as unknown as { canMove?(c: Context): boolean; eval(c: Context): Move[] };
      const can = typeof fn.canMove === "function" ? fn.canMove(ctx) : fn.eval(ctx).length > 0;
      if (can) return true;
    }
    return false;
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

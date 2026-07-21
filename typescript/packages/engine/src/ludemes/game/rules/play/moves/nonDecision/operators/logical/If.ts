// @java Core/src/game/rules/play/moves/nonDecision/operators/logical/If.java

/**
 * Returns, depending on the condition, a list of legal moves or an other list.
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/If.java
 * @author Eric.Piette and cambolbro
 */

import type { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import type { BooleanFunction, MovesFunction } from "../../../../../../../base.js";
import { applyPostStateThen } from "../../effect/Then.js";

/**
 * Minimal interface for a Then (consequence moves following a primary move).
 * @java game/rules/play/moves/nonDecision/effect/Then.java
 */
interface ThenLike {
  moves(): { eval(ctx: Context): Move[] };
}

/**
 * Returns, depending on the condition, a list of legal moves or another list.
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/If.java
 *
 * Java: public final class If extends Operator
 */
export class If implements MovesFunction {
  /** @java If.cond — which condition */
  readonly cond: BooleanFunction;

  /** @java If.list — if the condition is true */
  readonly list: MovesFunction;

  /** @java If.elseList — if the condition is false */
  readonly elseList: MovesFunction | null;

  /** @java Operator._then (from super(then)) */
  private readonly _then: ThenLike | null;

  // -------------------------------------------------------------------------

  /**
   * @param cond     The condition to satisfy to get the first list of legal moves.
   * @param list     The first list of legal moves.
   * @param elseList The other list of legal moves if the condition is not satisfied.
   * @param then     The moves applied after that move is applied.
   * @java If(BooleanFunction, Moves, Moves, Then)
   */
  public constructor(
    cond: BooleanFunction,
    list: MovesFunction,
    elseList: MovesFunction | null = null,
    then: ThenLike | null = null,
  ) {
    this.cond = cond;
    this.list = list;
    this.elseList = elseList;
    this._then = then;
  }

  // -------------------------------------------------------------------------

  /** @java If.then() */
  public then(): ThenLike | null {
    return this._then;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/If.java — eval(Context)
   *
   * Java lines 119-145:
   *   if (cond.eval(context)) {
   *     final Moves moves = list.eval(context);
   *     if (then() != null) for (j ...) moves.moves().get(j).then().add(then().moves());
   *     return moves;
   *   } else if (elseList != null) {
   *     final Moves moves = elseList.eval(context);
   *     if (then() != null) for (j ...) moves.moves().get(j).then().add(then().moves());
   *     return moves;
   *   }
   *   final Moves moves = new BaseMoves(super.then());
   *   if (then() != null) for (j ...) moves.moves().get(j).then().add(then().moves());
   *   return new BaseMoves(super.then());
   */
  public eval(ctx: Context): Move[] {
    if (this.cond.eval(ctx)) {
      // @java return list.eval(context) with then applied
      const moves = this.list.eval(ctx);
      // @java If.java: if (then() != null) moves.moves().get(j).then().add(then().moves());
      // Java evaluates the then AFTER the move applies; applyPostStateThen bakes the
      // post-state consequence actions into each generated move (same recipe as the
      // effect classes — e.g. El Perro's play-level (then (… (set Value P2 …)))).
      if (this._then !== null) return moves.map(m => applyPostStateThen(this._then, ctx, m));
      return moves;
    } else if (this.elseList !== null) {
      // @java return elseList.eval(context) with then applied
      const moves = this.elseList.eval(ctx);
      if (this._then !== null) return moves.map(m => applyPostStateThen(this._then, ctx, m));
      return moves;
    }

    // @java return new BaseMoves(super.then()); — empty result
    return [];
  }

  // -------------------------------------------------------------------------

  /**
   * @java If.java:150-159 — canMove(Context)
   *
   * Java:
   *   if (cond.eval(context)) return list.canMove(context);
   *   else if (elseList != null) return elseList.canMove(context);
   *   return false;
   *
   * WAVE-16 LAZY-CANMOVE FIX: this used to call `this.list.eval(ctx).length
   * > 0` / `this.elseList.eval(ctx).length > 0`, forcing a full eval() of
   * the taken branch even when that branch is itself an Or/Priority/If
   * whose own canMove() could stop early. Delegating to the branch's
   * polymorphic canMove() (falling back to eval().length>0 for leaf
   * ludemes with no override — Java's own base-class default) restores
   * Java's lazy short-circuit chain.
   *
   * NOTE (wave16 verification): wave15's fenix-suffragetto-open.md, Target
   * 2, attributed Suffragetto's java-ply-254 RNG desync to this exact gap
   * (Suffragetto's "SameTurn" If wraps an Or of a capturing MoveHop chain
   * vs. a bare Pass). That specific desync is already closed as of commit
   * 42158a431e ("Suffragetto Pass-path stalemated probe on the REAL rng"),
   * confirmed via byte-identical SitesRandom-draw traces at that ply with
   * and without this If.canMove() fix. This override remains a correct,
   * faithful Java port kept for general correctness; it does not move
   * Suffragetto's current ply-2761 MOVE_MISMATCH. See wave16 validation
   * notes.
   */
  public canMove(ctx: Context): boolean {
    if (this.cond.eval(ctx)) return ifCanMoveOf(this.list, ctx);
    else if (this.elseList !== null) return ifCanMoveOf(this.elseList, ctx);
    return false;
  }

  /**
   * @java If.canMoveTo(Context, int)
   */
  public canMoveTo(ctx: Context, target: number): boolean {
    const candidates = this.cond.eval(ctx)
      ? this.list.eval(ctx)
      : (this.elseList !== null ? this.elseList.eval(ctx) : []);
    for (const m of candidates) {
      if (m.siteIndices && m.siteIndices[m.siteIndices.length - 1] === target)
        return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------

  /** @java If.isStatic() */
  public isStatic(): boolean {
    if (this.cond !== null && !(this.cond as unknown as { isStatic?(): boolean }).isStatic?.()) return false;
    if (this.list !== null && !(this.list as unknown as { isStatic?(): boolean }).isStatic?.()) return false;
    if (this.elseList !== null && !(this.elseList as unknown as { isStatic?(): boolean }).isStatic?.()) return false;
    return true;
  }

  /** @java If.preprocess(Game) */
  public preprocess(game: unknown): void {
    (this.cond as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    (this.list as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    if (this.elseList !== null) {
      (this.elseList as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    }
  }

  /** @java If.missingRequirement(Game) */
  public missingRequirement(game: unknown): boolean {
    let missing = false;
    if (this.cond !== null) {
      missing = missing || ((this.cond as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    }
    if (this.list !== null) {
      missing = missing || ((this.list as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    }
    if (this.elseList !== null) {
      missing = missing || ((this.elseList as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    }
    if (this._then !== null) {
      missing = missing || ((this._then.moves() as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    }
    return missing;
  }

  /** @java If.willCrash(Game) */
  public willCrash(game: unknown): boolean {
    let willCrash = false;
    if (this.cond !== null) {
      willCrash = willCrash || ((this.cond as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    }
    if (this.list !== null) {
      willCrash = willCrash || ((this.list as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    }
    if (this.elseList !== null) {
      willCrash = willCrash || ((this.elseList as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    }
    if (this._then !== null) {
      willCrash = willCrash || ((this._then.moves() as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    }
    return willCrash;
  }

  /** @java If.toEnglish(Game) */
  public toEnglish(game: unknown): string {
    let text = "if " + ((this.cond as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "");

    const listEnglish = (this.list as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "";
    if (this.list !== null && listEnglish !== "") {
      text += ", " + listEnglish;
    }

    if (this.elseList !== null) {
      const elseEnglish = (this.elseList as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "";
      if (elseEnglish !== "") {
        text += ", else " + elseEnglish;
      }
    }

    return text;
  }
}

/**
 * @java Moves.canMove(Context) — the base-class dispatch a sub-ludeme falls
 * back to when it has no `canMove()` override of its own (Java: the
 * abstract `Moves` class's own canMove() eagerly evaluates via
 * movesIterator()/eval(); TS's leaf ludemes mirror that eager fallback).
 * Used by If.canMove() to delegate polymorphically to whichever ludeme is
 * in the taken branch, exactly matching Java's `list.canMove(context)` /
 * `elseList.canMove(context)` recursive dispatch (If.java:150-159). See
 * MaxMoves.ts's canMove() for the same established idiom.
 */
function ifCanMoveOf(node: MovesFunction, ctx: Context): boolean {
  const fn = node as unknown as { canMove?(c: Context): boolean; eval(c: Context): Move[] };
  return typeof fn.canMove === "function" ? fn.canMove(ctx) : fn.eval(ctx).length > 0;
}

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
   * @java If.canMove(Context)
   */
  public canMove(ctx: Context): boolean {
    if (this.cond.eval(ctx)) return this.list.eval(ctx).length > 0;
    else if (this.elseList !== null) return this.elseList.eval(ctx).length > 0;
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

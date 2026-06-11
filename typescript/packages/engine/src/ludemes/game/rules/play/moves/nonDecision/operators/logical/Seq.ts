// @java Core/src/game/rules/play/moves/nonDecision/operators/logical/Seq.java

/**
 * Applies a sequence of moves one by one. Each move will use the new
 * (temporary) state/context created by the previous move applied in the
 * sequence.
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/Seq.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../../base.js";
import { Effect } from "../../effect/Effect.js";
import { applyMoveWithThens } from "../../effect/Then.js";

/**
 * Applies a sequence of moves one by one.
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/Seq.java
 *
 * Java: public final class Seq extends Effect
 */
export class Seq extends Effect {
  /**
   * @java Seq.moves — the sequence of moves.
   * Renamed to _seqMoves to avoid shadowing Moves.moves() from the base class.
   */
  readonly _seqMoves: MovesFunction[];

  // -------------------------------------------------------------------------

  /**
   * @param moves Moves to apply one by one.
   * @java Seq(Moves[])
   */
  public constructor(moves: MovesFunction[]) {
    super(null);
    this._seqMoves = moves;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/Seq.java — eval(Context)
   *
   * Java lines 47-73:
   *   final Moves result = new BaseMoves(super.then());
   *   if (moves.length == 0) return result;
   *   Context tempContext = new TempContext(context);
   *   for (int i = 0; i < moves.length; i++) {
   *     final Moves movesToApply = moves[i];
   *     for (final Move m : movesToApply.eval(tempContext).moves()) {
   *       final Move appliedMove = (Move) m.apply(tempContext, true);
   *       result.moves().add(appliedMove);
   *     }
   *   }
   *   return result;
   *
   * @remarks TempContext (state-forking) is not available in the TS port.
   * We approximate by collecting moves from each sub-list in sequence against
   * the same context (no sequential state application). This is a known
   * approximation — the Java version applies each move to a temporary context.
   */
  public override eval(context: Context): Move[] {
    // @java final Moves result = new BaseMoves(super.then());
    const result: Move[] = [];

    // @java if (moves.length == 0) return result;
    if (this._seqMoves.length === 0) return result;

    // @java Context tempContext = new TempContext(context) — each sub-move
    // APPLIES to the fork before the next evaluates: Chameleons' SwitchColour
    // reads (state at:X) that the previous seq step just wrote ((set State
    // at:(last To) 2) then (= (state at:site) 0) must see the 2, else the
    // conversion branch fires spuriously).
    let tempState = context.state;
    const Ctor = context.constructor as new (...a: unknown[]) => Context;
    type Scratch = {
      _radials?: unknown; _trajectories?: unknown;
      _evalFrom?: number; _evalTo?: number; _evalSite?: number; _evalBetween?: number;
    };
    const src = context as Context & Scratch;
    for (let i = 0; i < this._seqMoves.length; i++) {
      const movesToApply = this._seqMoves[i]!;
      const tempCtx = new Ctor(context.game, tempState, context.trial, context.rng) as Context & Scratch;
      tempCtx._radials = src._radials;
      tempCtx._trajectories = src._trajectories;
      tempCtx._evalFrom = src._evalFrom;
      tempCtx._evalTo = src._evalTo;
      tempCtx._evalSite = src._evalSite;
      tempCtx._evalBetween = src._evalBetween;
      // @java for (final Move m : movesToApply.eval(tempContext).moves())
      //         result.moves().add((Move) m.apply(tempContext, true));
      const generatedMoves = movesToApply.eval(tempCtx);
      for (const m of generatedMoves) {
        tempState = applyMoveWithThens(tempCtx, m, tempState) as typeof tempState;
        result.push(m);
      }
    }

    // @java (then chaining commented out in Java source as well)
    // // if (then() != null)
    // //   for (int j = 0; j < result.moves().size(); j++)
    // //     result.moves().get(j).then().add(then().moves());

    return result;
  }

  // -------------------------------------------------------------------------

  /** @java Seq.isStatic() */
  public override isStatic(): boolean {
    return false;
  }

  /** @java Seq.preprocess(Game) */
  public override preprocess(): void {
    for (let i = 0; i < this._seqMoves.length; i++) {
      (this._seqMoves[i] as unknown as { preprocess?(): void }).preprocess?.();
    }
    super.preprocess();
  }

  /** @java Seq.missingRequirement(Game) */
  public missingRequirement(game: unknown): boolean {
    let missing = false;
    for (let i = 0; i < this._seqMoves.length; i++) {
      missing = missing || ((this._seqMoves[i] as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    }
    return missing;
  }

  /** @java Seq.willCrash(Game) */
  public willCrash(game: unknown): boolean {
    let willCrash = false;
    for (let i = 0; i < this._seqMoves.length; i++) {
      willCrash = willCrash || ((this._seqMoves[i] as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    }
    return willCrash;
  }

  /** @java Seq.toEnglish(Game) */
  public toEnglish(game: unknown): string {
    let nextString = "";
    for (let i = 0; i < this._seqMoves.length - 1; i++) {
      nextString += ((this._seqMoves[i] as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "") + " ,";
    }
    if (this._seqMoves.length !== 0) {
      nextString += (this._seqMoves[this._seqMoves.length - 1] as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "";
    }

    let thenString = "";
    if (this.then() !== null) {
      thenString = " then " + ((this.then()!.moves() as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "");
    }

    return nextString + thenString;
  }
}

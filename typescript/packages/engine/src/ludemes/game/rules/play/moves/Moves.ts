// @java Core/src/game/rules/play/moves/Moves.java

/**
 * Abstract base class for move generators.
 *
 * @java game/rules/play/moves/Moves.java
 *
 * Java: public abstract class Moves extends BaseLudeme implements GameType
 *   - holds a FastArrayList<Move> moves (the generated move list)
 *   - holds a Then consequent
 *   - isDecision flag, applyAfterAllMoves flag
 *   - abstract eval(Context) returns Moves
 *   - gameFlags, isStatic, preprocess, toString, movesIterator, canMove
 */

import type { Context } from "../../../../../context.js";
import type { Move } from "../../../../../move.js";
import type { BooleanFunction, MovesFunction } from "../../../../base.js";

/**
 * Minimal interface for Then (consequence moves following a primary move).
 * @java game/rules/play/moves/nonDecision/effect/Then.java
 */
export interface ThenLike {
  /** @java Then.moves() — the consequent Moves object */
  moves(): MovesLike;
}

/**
 * Minimal interface for a Moves object (used as return type and held reference).
 * @java game/rules/play/moves/Moves.java
 */
export interface MovesLike {
  /** @java Moves.eval(Context) */
  eval(ctx: Context): MovesLike;
  /** @java Moves.moves() — the generated move list */
  moves(): Move[];
  /** @java Moves.then() */
  then(): ThenLike | null;
  /** @java Moves.gameFlags(Game) */
  gameFlags(): number;
  /** @java Moves.isStatic() */
  isStatic(): boolean;
  /** @java Moves.preprocess(Game) */
  preprocess(): void;
}

/**
 * Abstract base class for all move generators.
 *
 * @java game/rules/play/moves/Moves.java
 *
 * Concrete subclasses implement eval(Context) to return the generated moves.
 * The class also provides helper methods for iterating moves, querying flags, etc.
 */
export abstract class Moves implements MovesFunction {
  // -------------------------------------------------------------------------
  // Fields

  /** Generated moves list. @java Moves.moves */
  private readonly _moves: Move[] = [];

  /** Consequent actions. @java Moves.then */
  private _then: ThenLike | null;

  /** Whether this generates decision moves. @java Moves.isDecision */
  private _isDecision: boolean = false;

  /** Used in simultaneous games. @java Moves.applyAfterAllMoves */
  private _applyAfterAllMoves: boolean = false;

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/Moves.java — constructor(Then)
   * @param then The subsequents of the moves.
   */
  public constructor(then: ThenLike | null = null) {
    this._then = then;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Moves.moves() — FastArrayList<Move> moves
   */
  public moves(): Move[] {
    return this._moves;
  }

  /**
   * @java Moves.then()
   */
  public then(): ThenLike | null {
    return this._then;
  }

  /**
   * @java Moves.setThen(Then)
   */
  public setThen(then: ThenLike | null): void {
    this._then = then;
  }

  /**
   * @java Moves.count()
   */
  public count(): number {
    return this._moves.length;
  }

  /**
   * @java Moves.get(int)
   */
  public get(n: number): Move {
    return this._moves[n]!;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Moves.eval(Context) — abstract
   * Evaluates this moves generator in the given context.
   */
  public abstract eval(ctx: Context): Move[];

  // -------------------------------------------------------------------------

  /**
   * @java Moves.canMoveTo(Context, int)
   * Returns true if this generator can generate a move to the target site.
   */
  public canMoveTo(ctx: Context, target: number): boolean {
    const generated = this.eval(ctx);
    for (const m of generated) {
      // @java Move.toNonDecision()
      if (m.siteIndices && m.siteIndices[m.siteIndices.length - 1] === target)
        return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Moves.preprocess(Game)
   */
  public preprocess(): void {
    if (this._then != null)
      this._then.moves().preprocess();
  }

  /**
   * @java Moves.gameFlags(Game)
   */
  public gameFlags(): number {
    let result = 0;
    if (this._then != null)
      result |= this._then.moves().gameFlags();
    return result;
  }

  /**
   * @java Moves.isStatic()
   */
  public isStatic(): boolean {
    if (this._then != null)
      return this._then.moves().isStatic();
    return false;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Moves.toString()
   */
  public toString(): string {
    const parts = this._moves.map(m => m.toString());
    let result = parts.join(", ");
    if (this._then != null)
      result += this._then.toString();
    return result;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Moves.isConstraintsMoves()
   */
  public isConstraintsMoves(): boolean {
    return false;
  }

  /**
   * @java Moves.isDecision()
   */
  public isDecision(): boolean {
    return this._isDecision;
  }

  /**
   * @java Moves.setDecision()
   */
  public setDecision(): void {
    this._isDecision = true;
  }

  /**
   * @java Moves.applyAfterAllMoves()
   */
  public applyAfterAllMoves(): boolean {
    return this._applyAfterAllMoves;
  }

  /**
   * @java Moves.setApplyAfterAllMoves(boolean)
   */
  public setApplyAfterAllMoves(value: boolean): void {
    this._applyAfterAllMoves = value;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Moves.canMove(Context)
   * Returns true if there is at least one legal move in the given context
   * that also passes NoRepeat (Java: `NoRepeat.apply(c, m) && NoSuicide.apply(c,
   * m)`; NoSuicide is not ported, so it is treated as always-true here,
   * matching pre-existing behaviour for every game that doesn't declare
   * `(meta (no Repeat ...))`).
   */
  public canMove(ctx: Context): boolean {
    const generated = this.eval(ctx);
    const game = ctx.game as { passesNoRepeat?(c: Context, m: Move): boolean };
    if (typeof game.passesNoRepeat === "function") {
      return generated.some(m => game.passesNoRepeat!(ctx, m));
    }
    return generated.length > 0;
  }
}

// Export a BooleanFunction type for condition checks used in subclasses
export type { BooleanFunction };

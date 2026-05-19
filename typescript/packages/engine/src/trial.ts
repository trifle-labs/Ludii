/**
 * Java parity:
 * - Core/src/other/trial/Trial.java
 *
 * Records the sequence of moves played. The TS slice keeps the move log
 * + over/winner flags, plus the Java-shape accessors the engine
 * actually exercises (lastMove, getMove, generate*MovesList,
 * numInitialPlacementMoves, ranking, status). The undo-bookkeeping
 * surface (previousStates, RNGStates, AuxilTrialData) is deferred.
 */

import type { Move } from "./move.js";

/**
 * Java parity: `other.trial.Trial.Status`. The MVE only needs to know
 * whether the trial ended and who, if anyone, won; richer outcomes
 * (Loss/Draw/Abandoned) collapse onto `over` + `winner`.
 */
export interface TrialStatus {
  readonly over: boolean;
  readonly winner: number;
}

export class Trial {
  public readonly moves: readonly Move[];
  public readonly over: boolean;
  public readonly winner: number;
  public readonly numInitialPlacementMoves: number;

  public constructor(
    moves: readonly Move[],
    over: boolean,
    winner: number,
    numInitialPlacementMoves = 0,
  ) {
    if (!Number.isInteger(winner) || winner < -1) {
      throw new Error(`winner must be >= -1; got ${winner}.`);
    }
    if (!over && winner !== -1) {
      throw new Error("Non-terminal trial must report winner = -1.");
    }
    if (
      !Number.isInteger(numInitialPlacementMoves) ||
      numInitialPlacementMoves < 0
    ) {
      throw new Error(
        `numInitialPlacementMoves must be a non-negative integer; got ${numInitialPlacementMoves}.`,
      );
    }
    this.moves = Object.freeze([...moves]);
    this.over = over;
    this.winner = winner;
    this.numInitialPlacementMoves = numInitialPlacementMoves;
  }

  public get numMoves(): number {
    return this.moves.length;
  }

  public withMove(move: Move, over: boolean, winner: number): Trial {
    return new Trial(
      [...this.moves, move],
      over,
      winner,
      this.numInitialPlacementMoves,
    );
  }

  /** Java parity: `Trial.lastMove()` — undefined when no moves yet. */
  public lastMove(): Move | undefined;
  /** Java parity: `Trial.lastMove(pid)` — last move made by `pid`. */
  public lastMove(pid: number): Move | undefined;
  public lastMove(pid?: number): Move | undefined {
    if (pid === undefined) {
      return this.moves[this.moves.length - 1];
    }
    for (let i = this.moves.length - 1; i >= 0; i -= 1) {
      const move = this.moves[i];
      if (move?.mover === pid) {
        return move;
      }
    }
    return undefined;
  }

  /** Java parity: `Trial.getMove(idx)`. Returns undefined if out of range. */
  public getMove(idx: number): Move | undefined {
    if (!Number.isInteger(idx) || idx < 0) return undefined;
    return this.moves[idx];
  }

  /**
   * Java parity: `Trial.generateCompleteMovesList()` returns every move
   * including the initial-placement prefix.
   */
  public generateCompleteMovesList(): readonly Move[] {
    return this.moves;
  }

  /**
   * Java parity: `Trial.generateRealMovesList()` returns moves played
   * after the initial-placement prefix — the "user" moves.
   */
  public generateRealMovesList(): readonly Move[] {
    return this.numInitialPlacementMoves === 0
      ? this.moves
      : this.moves.slice(this.numInitialPlacementMoves);
  }

  public *reverseMoveIterator(): IterableIterator<Move> {
    for (let i = this.moves.length - 1; i >= 0; i -= 1) {
      const move = this.moves[i];
      if (move !== undefined) yield move;
    }
  }

  public status(): TrialStatus {
    return { over: this.over, winner: this.winner };
  }
}

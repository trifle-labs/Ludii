// @java Core/src/other/trial/Trial.java Trial
/**
 * Java parity:
 * - Core/src/other/trial/Trial.java
 *
 * Records the sequence of moves played. The TS slice keeps the move log
 * + over/winner flags + the Java-shape accessors the engine actually
 * exercises (lastMove, getMove, generate*MovesList,
 * numInitialPlacementMoves, ranking, status). State-history hashes
 * (`previousStates`, `previousStatesWithinATurn`) are tracked
 * immutably; AuxilTrialData and the GUI-side legal-moves history
 * remain deferred.
 */

import type { Move } from "./move.js";
import type { State } from "./state.js";

/**
 * Java parity: `other.trial.Trial.Status`. The MVE only needs to know
 * whether the trial ended and who, if anyone, won; richer outcomes
 * (Loss/Draw/Abandoned) collapse onto `over` + `winner`.
 */
export interface TrialStatus {
  readonly over: boolean;
  readonly winner: number;
}

export interface TrialOptions {
  readonly numInitialPlacementMoves?: number;
  readonly previousStates?: readonly number[];
  readonly previousStatesWithinATurn?: readonly number[];
  readonly ranking?: readonly number[];
}

export class Trial {
  public readonly moves: readonly Move[];
  public readonly over: boolean;
  public readonly winner: number;
  public readonly numInitialPlacementMoves: number;
  public readonly previousStates: readonly number[];
  public readonly previousStatesWithinATurn: readonly number[];
  public readonly ranking: readonly number[];

  /**
   * Starting positions per component index.
   * @java other/trial/Trial.java — startingPos: List<Region>
   * Populated by Game1to1.start() from the initial board placement.
   * Used by (sites Start (piece ...)) in defines like InitialPawnMove.
   */
  public _startingPos: number[][] | null = null;

  public constructor(
    moves: readonly Move[],
    over: boolean,
    winner: number,
    options: TrialOptions | number = 0,
  ) {
    // The earlier signature took `numInitialPlacementMoves` as a positional
    // 4th arg; accept either shape for backwards-compat.
    const opts: TrialOptions =
      typeof options === "number"
        ? { numInitialPlacementMoves: options }
        : options;
    const numInitialPlacementMoves = opts.numInitialPlacementMoves ?? 0;

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
    this.previousStates = Object.freeze([...(opts.previousStates ?? [])]);
    this.previousStatesWithinATurn = Object.freeze([
      ...(opts.previousStatesWithinATurn ?? []),
    ]);
    this.ranking = Object.freeze([...(opts.ranking ?? [])]);
  }

  public get numMoves(): number {
    return this.moves.length;
  }

  public withMove(move: Move, over: boolean, winner: number): Trial {
    const t = new Trial([...this.moves, move], over, winner, {
      numInitialPlacementMoves: this.numInitialPlacementMoves,
      previousStates: this.previousStates,
      previousStatesWithinATurn: this.previousStatesWithinATurn,
      ranking: this.ranking,
    });
    // Carry forward _startingPos (immutable starting positions, never changes during play).
    // @java Trial.java — startingPos is set once at game start and never modified.
    t._startingPos = this._startingPos;
    return t;
  }

  /**
   * Java parity: `Trial.storeStates()` / `Trial.saveState(state)`.
   * Returns a new Trial with `state.hash()` appended to both history
   * arrays. The TS port is immutable so each call yields a new value.
   */
  public saveState(state: State): Trial {
    const hash = state.hash();
    const t = new Trial(this.moves, this.over, this.winner, {
      numInitialPlacementMoves: this.numInitialPlacementMoves,
      previousStates: [...this.previousStates, hash],
      previousStatesWithinATurn: [...this.previousStatesWithinATurn, hash],
      ranking: this.ranking,
    });
    t._startingPos = this._startingPos;
    return t;
  }

  /**
   * Java parity: `Trial.clearLegalMoves()` resets per-turn caches; here
   * the analogous reset clears only `previousStatesWithinATurn` (kept
   * for repetition detection across consecutive turns).
   */
  public newTurn(): Trial {
    const t = new Trial(this.moves, this.over, this.winner, {
      numInitialPlacementMoves: this.numInitialPlacementMoves,
      previousStates: this.previousStates,
      previousStatesWithinATurn: [],
      ranking: this.ranking,
    });
    t._startingPos = this._startingPos;
    return t;
  }

  public withRanking(ranking: readonly number[]): Trial {
    const t = new Trial(this.moves, this.over, this.winner, {
      numInitialPlacementMoves: this.numInitialPlacementMoves,
      previousStates: this.previousStates,
      previousStatesWithinATurn: this.previousStatesWithinATurn,
      ranking,
    });
    t._startingPos = this._startingPos;
    return t;
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

  /**
   * Java parity: `Trial.lastTurnMover(moverId)` — scan backward and return the
   * most recent mover that differs from the current same-turn mover.
   */
  public lastTurnMover(moverId: number): number {
    for (let i = this.moves.length - 1; i >= 0; i -= 1) {
      const mover = this.moves[i]?.mover;
      if (mover !== undefined && mover !== moverId) return mover;
    }
    return -1;
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

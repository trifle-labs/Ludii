// @java Core/src/other/trial/Trial.java Trial
/**
 * Faithful 1:1 transliteration of other.trial.Trial.
 *
 * Instance of a played game, consisting of states and turns.
 *
 * Deferrals:
 *  - saveTrialToFile / saveTrialToTextFile / convertTrialToString: I/O
 *    operations not applicable in a browser runtime; bodies throw.
 *  - setLegalMoves(): meta-rule filtering (NoRepeat / NoSuicide) depends on
 *    the full rule-eval subsystem; structural stub only.
 *  - numLogicalDecisions / numPlausibleDecisions: require full apply loop;
 *    structural stubs provided.
 *  - MoveSequence: inlined as an array of IMove for minimal fidelity.
 *
 * Java parity: other/trial/Trial.java
 */

import type { IGame, IMoves, IMove } from "../context/Context.js";
import { AuxilTrialData } from "./AuxilTrialData.js";

// ---------------------------------------------------------------------------
// Minimal Status (Java: main.Status)
// ---------------------------------------------------------------------------
export interface IStatus {
  winner(): number;
  endType(): string;
}

// ---------------------------------------------------------------------------
// Trial
// ---------------------------------------------------------------------------
export class Trial {

  // @java private MoveSequence moves;
  // Inlined: MoveSequence backed by a plain array
  private _moves: IMove[] = [];

  // @java private int numInitialPlacementMoves = 0;
  private _numInitialPlacementMoves: number = 0;

  // @java private List<Region> startingPos;
  private _startingPos: unknown[] | null = null;

  // @java protected Status status = null;
  protected _status: IStatus | null = null;

  // @java protected Moves legalMoves;
  protected _legalMoves: IMoves | null = null;

  // @java private FastTLongArrayList previousStates;
  private _previousStates: number[] | null = null;

  // @java private FastTLongArrayList previousStatesWithinATurn;
  private _previousStatesWithinATurn: number[] | null = null;

  // @java private int numSubmovesPlayed = 0;
  private _numSubmovesPlayed: number = 0;

  // @java private double[] ranking;
  private _ranking: number[];

  // @java protected transient AuxilTrialData auxilTrialData = null;
  protected _auxilTrialData: AuxilTrialData | null = null;

  // @java private List<UndoData> endData = null;
  // UndoData is deferred; stored as opaque
  private _endData: unknown[] | null = null;

  // @java private List<RandomProviderState> RNGStates = null;
  private _RNGStates: unknown[] | null = null;

  // -------------------------------------------------------------------------
  // Constructors
  // -------------------------------------------------------------------------

  /**
   * @java public Trial(final Game game)
   */
  constructor(game: IGame);

  /**
   * @java public Trial(final Trial other)  — copy constructor
   */
  constructor(other: Trial);

  constructor(arg: IGame | Trial) {
    if (arg instanceof Trial) {
      // Copy constructor
      const other = arg;
      this._moves = this.copyMoveSequence(other._moves);
      this._numInitialPlacementMoves = other._numInitialPlacementMoves;
      this._startingPos = other._startingPos !== null ? [...other._startingPos] : null;
      this._status = other._status;           // shared ref (usually null)
      this._legalMoves = other._legalMoves;   // intentional ref copy
      this._previousStates = other._previousStates !== null ? [...other._previousStates] : null;
      this._previousStatesWithinATurn = other._previousStatesWithinATurn !== null
        ? [...other._previousStatesWithinATurn] : null;
      this._numSubmovesPlayed = other._numSubmovesPlayed;
      this._ranking = [...other._ranking];
      if (other._endData !== null) {
        this._endData  = [...other._endData];
        this._RNGStates = [...(other._RNGStates ?? [])];
      }
      // auxilTrialData NOT copied (transient, see Java comment)
    } else {
      // Game constructor
      const game = arg;
      if (game.hasSubgames()) {
        this._startingPos = null;
        this._legalMoves  = null;
        this._previousStates = null;
        this._previousStatesWithinATurn = null;
      } else {
        this._startingPos = [];
        this._legalMoves  = makeEmptyMoves();
        this._previousStates = [];
        this._previousStatesWithinATurn = [];
      }
      this._ranking = new Array<number>(game.players().count() + 1).fill(0);
      this._endData  = [];
      this._RNGStates = [];
    }
  }

  // -------------------------------------------------------------------------
  // copyMoveSequence (virtual in Java, overridden in TempTrial)
  // -------------------------------------------------------------------------

  /** @java protected MoveSequence copyMoveSequence(final MoveSequence otherSequence) */
  protected copyMoveSequence(other: IMove[]): IMove[] {
    return [...other];
  }

  // -------------------------------------------------------------------------
  // resetToTrial
  // -------------------------------------------------------------------------

  /** @java public void resetToTrial(final Trial trial) */
  resetToTrial(trial: Trial): void {
    this._moves = this.copyMoveSequence(trial._moves);
    this._numInitialPlacementMoves = trial._numInitialPlacementMoves;
    this._startingPos = trial._startingPos !== null ? [...trial._startingPos] : null;
    this._status      = trial._status;
    this._legalMoves  = trial._legalMoves;
    this._previousStates = trial._previousStates !== null ? [...trial._previousStates] : null;
    this._previousStatesWithinATurn = trial._previousStatesWithinATurn !== null
      ? [...trial._previousStatesWithinATurn] : null;
    this._numSubmovesPlayed = trial._numSubmovesPlayed;
    this._ranking = [...trial._ranking];
    this._endData   = [...(trial._endData  ?? [])];
    this._RNGStates = [...(trial._RNGStates ?? [])];
  }

  // -------------------------------------------------------------------------
  // auxilTrialData
  // -------------------------------------------------------------------------

  auxilTrialData(): AuxilTrialData | null { return this._auxilTrialData; }

  // -------------------------------------------------------------------------
  // Move management
  // -------------------------------------------------------------------------

  /** @java public void addMove(final Move move) */
  addMove(move: IMove): void { this._moves.push(move); }

  /** @java public Move removeLastMove() */
  removeLastMove(): IMove | undefined { return this._moves.pop(); }

  /** @java public Move getMove(final int idx) */
  getMove(idx: number): IMove { return this._moves[idx]!; }

  /** @java public void replaceLastMove(final Move move) */
  replaceLastMove(move: IMove): void {
    if (this._moves.length > 0) this._moves[this._moves.length - 1] = move;
  }

  // -------------------------------------------------------------------------
  // Status
  // -------------------------------------------------------------------------

  status(): IStatus | null { return this._status; }
  setStatus(res: IStatus | null): void { this._status = res; }

  over(): boolean { return this._status !== null; }

  // -------------------------------------------------------------------------
  // Legal moves
  // -------------------------------------------------------------------------

  cachedLegalMoves(): IMoves {
    if (this.over()) return makeEmptyMoves();
    return this._legalMoves ?? makeEmptyMoves();
  }

  /**
   * @java public void setLegalMoves(final Moves legalMoves, final Context context)
   * DEFERRED: meta-rule filtering (NoRepeat/NoSuicide) not ported.
   * Stores the moves and handles the pass-insertion structural contract.
   */
  setLegalMoves(legalMoves: IMoves, _context: unknown): void {
    // DEFERRED: NoRepeat.apply / NoSuicide.apply filtering
    this._legalMoves = legalMoves;
    if (this._auxilTrialData !== null) {
      // DEFERRED: auxilTrialData.updateNewLegalMoves requires trial ref
    }
  }

  clearLegalMoves(): void { this._legalMoves = makeEmptyMoves(); }

  // -------------------------------------------------------------------------
  // Move list generation
  // -------------------------------------------------------------------------

  generateCompleteMovesList(): IMove[] { return [...this._moves]; }

  generateRealMovesList(): IMove[] {
    return this._moves.slice(this._numInitialPlacementMoves);
  }

  /** @java public Iterator<Move> reverseMoveIterator() */
  reverseMoveIterator(): Iterator<IMove> {
    let idx = this._moves.length - 1;
    const moves = this._moves;
    return {
      next(): IteratorResult<IMove> {
        if (idx < 0) return { value: undefined as unknown as IMove, done: true };
        return { value: moves[idx--]!, done: false };
      }
    };
  }

  // -------------------------------------------------------------------------
  // Reset
  // -------------------------------------------------------------------------

  /** @java public void reset(final Game game) */
  reset(game: IGame): void {
    this._moves = [];
    this._numInitialPlacementMoves = 0;
    if (this._startingPos !== null) this._startingPos.length = 0;
    this._status = null;
    if (this._legalMoves !== null) this.clearLegalMoves();
    if (this._previousStates !== null) this._previousStates.length = 0;
    if (this._previousStatesWithinATurn !== null) this._previousStatesWithinATurn.length = 0;
    this._numSubmovesPlayed = 0;
    if (this._auxilTrialData !== null) this._auxilTrialData.clear();
    this._ranking.fill(0);
    void game; // reference retained for API parity
  }

  // -------------------------------------------------------------------------
  // Move queries
  // -------------------------------------------------------------------------

  /** @java public Move lastMove() / lastMove(int pid) */
  lastMove(pid?: number): IMove | null {
    if (pid === undefined) {
      return this._moves.length > 0 ? (this._moves[this._moves.length - 1] ?? null) : null;
    }
    for (let i = this._moves.length - 1; i >= 0; i--) {
      const m = this._moves[i];
      if (m !== undefined && m.mover() === pid) return m;
    }
    return null;
  }

  lastTurnMover(moverId: number): number {
    for (let i = this._moves.length - 1; i >= 0; i--) {
      const m = this._moves[i];
      if (m === undefined) continue;
      const pid = m.mover();
      if (pid !== moverId) return pid;
    }
    return -1; // Constants.UNDEFINED
  }

  numMoves(): number { return this._moves.length; }

  numForcedPasses(): number {
    let count = 0;
    for (let i = this._numInitialPlacementMoves; i < this._moves.length; i++) {
      if ((this._moves[i] as unknown as { isForced?(): boolean }).isForced?.()) count++;
    }
    return count;
  }

  /**
   * @java public int numLogicalDecisions(final Game game)
   * DEFERRED: requires full apply loop on a fresh context.
   */
  numLogicalDecisions(_game: IGame): number {
    throw new Error("Trial.numLogicalDecisions: deferred – requires full apply loop");
  }

  /**
   * @java public int numPlausibleDecisions(final Game game)
   * DEFERRED: requires full 2-ply search.
   */
  numPlausibleDecisions(_game: IGame): number {
    throw new Error("Trial.numPlausibleDecisions: deferred – requires 2-ply search");
  }

  numInitPlacement(): number { return this._numInitialPlacementMoves; }
  numInitialPlacementMoves(): number { return this._numInitialPlacementMoves; }

  setNumInitialPlacementMoves(n: number): void { this._numInitialPlacementMoves = n; }
  addInitPlacement(): void { this._numInitialPlacementMoves++; }

  ranking(): number[] { return this._ranking; }

  moveNumber(): number { return this._moves.length - this._numInitialPlacementMoves; }

  numTurns(): number {
    let cur = 0;
    let count = 0;
    for (const m of this._moves) {
      if (m.mover() !== cur) { cur = m.mover(); count++; }
    }
    return count;
  }

  numberRealMoves(): number { return this._moves.length - this._numInitialPlacementMoves; }

  numSubmovesPlayed(): number { return this._numSubmovesPlayed; }
  setNumSubmovesPlayed(n: number): void { this._numSubmovesPlayed = n; }

  // -------------------------------------------------------------------------
  // Previous states
  // -------------------------------------------------------------------------

  previousState():           number[] | null { return this._previousStates; }
  previousStateWithinATurn():number[] | null { return this._previousStatesWithinATurn; }

  // -------------------------------------------------------------------------
  // Starting positions
  // -------------------------------------------------------------------------

  startingPos(idComponent?: number): unknown {
    if (idComponent !== undefined) return this._startingPos![idComponent];
    return this._startingPos;
  }

  // -------------------------------------------------------------------------
  // Auxiliary trial data
  // -------------------------------------------------------------------------

  /** @java public void saveState(final State state) */
  saveState(state: unknown): void {
    if (this._auxilTrialData !== null) this._auxilTrialData.saveState(state);
  }

  storeStates(): void {
    if (this._auxilTrialData === null) this._auxilTrialData = new AuxilTrialData();
    this._auxilTrialData.storeStates();
  }

  storeLegalMovesHistory(): void {
    if (this._auxilTrialData === null) this._auxilTrialData = new AuxilTrialData();
    this._auxilTrialData.storeLegalMovesHistory();
  }

  storeLegalMovesHistorySizes(): void {
    if (this._auxilTrialData === null) this._auxilTrialData = new AuxilTrialData();
    this._auxilTrialData.storeLegalMovesHistorySizes();
  }

  setLegalMovesHistory(legalMovesHistory: IMove[][]): void {
    if (this._auxilTrialData === null) this._auxilTrialData = new AuxilTrialData();
    this._auxilTrialData.setLegalMovesHistory(legalMovesHistory);
  }

  setLegalMovesHistorySizes(sizes: number[]): void {
    if (this._auxilTrialData === null) this._auxilTrialData = new AuxilTrialData();
    this._auxilTrialData.setLegalMovesHistorySizes(sizes);
  }

  // -------------------------------------------------------------------------
  // Undo data
  // -------------------------------------------------------------------------

  endData(): unknown[] | null { return this._endData; }
  addUndoData(endDatum: unknown): void { this._endData?.push(endDatum); }
  removeLastEndData(): void { this._endData?.pop(); }

  RNGStates(): unknown[] | null { return this._RNGStates; }
  addRNGState(s: unknown): void { this._RNGStates?.push(s); }
  removeLastRNGStates(): void { this._RNGStates?.pop(); }

  nullUndoData(): void {
    this._endData  = null;
    this._RNGStates = null;
  }

  // -------------------------------------------------------------------------
  // I/O — DEFERRED
  // -------------------------------------------------------------------------

  saveTrialToFile(..._args: unknown[]): void {
    throw new Error("Trial.saveTrialToFile: deferred – I/O not applicable in TS");
  }

  saveTrialToTextFile(..._args: unknown[]): void {
    throw new Error("Trial.saveTrialToTextFile: deferred – I/O not applicable in TS");
  }

  convertTrialToString(..._args: unknown[]): string {
    // Minimal toString for debugging
    return `Trial[moves=${this._moves.length}, over=${this.over()}]`;
  }

  toString(): string { return this.convertTrialToString(); }
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function makeEmptyMoves(): IMoves {
  const list: IMove[] = [];
  return {
    moves() {
      return {
        size()                { return list.length; },
        get(i: number): IMove { return list[i]!; },
        removeSwap(i: number) { list.splice(i, 1); },
        isEmpty()             { return list.length === 0; },
        add(m: IMove)         { list.push(m); },
      };
    }
  };
}

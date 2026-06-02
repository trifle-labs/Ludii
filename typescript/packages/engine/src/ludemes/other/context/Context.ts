// @java Core/src/other/context/Context.java Context
/**
 * Faithful 1:1 transliteration of other.context.Context.
 *
 * NOTE: The engine's *working* Context lives at src/context.ts and must
 * NOT be modified.  This file is a coverage transliteration that
 * faithfully maps the Java class structure for reference/completeness.
 *
 * Deferrals (parts that need absent subsystems):
 *  - RNG (SplitMix64): replaced by a simple number seed / nextLong stub.
 *  - Game / State / Trial / Model: replaced by opaque interfaces matching
 *    the minimal surface called in Context.java.
 *  - ThinkingThread / locking (ReentrantLock): not applicable in TS.
 *  - advanceInstance(): references Subgame + MatchModel; body deferred.
 *  - convertRole(): references RoleType Id ludeme eval; body deferred.
 *  - allPass(): full implementation requires reverseMoveIterator; deferred.
 *  - storeCurrentData(): references UndoData; deferred.
 *
 * Java parity: other/context/Context.java
 */

import { EvalContext, type Region, type RegionFunction } from "./EvalContext.js";

// ---------------------------------------------------------------------------
// Minimal opaque interfaces for types that live in other engine modules.
// ---------------------------------------------------------------------------

/** Minimal surface of other.state.State */
export interface IState {
  mover(): number;
  next(): number;
  prev(): number;
  currentPhase(player: number): number;
  playerToAgent(player: number): number;
  getTeam(pid: number): number;
  setMover(v: number): void;
  setNext(v: number): void;
  setPrev(v: number): void;
  setActive(who: number, newActive: boolean, active: number): number;
  updateHashAllPlayersInactive(): void;
  setScore(pid: number, score: number, scores: number[]): void;
  setPayoff(pid: number, payoff: number, payoffs: number[]): void;
  containerStates(): { length: number };
  pendingValues(): unknown;
  counter(): number;
  numTurn(): number;
  numTurnSamePlayer(): number;
  numConsecutivesPasses(): number;
  remainingDominoes(): unknown;
  visited(): unknown;
  sitesToRemove(): unknown;
  onTrackIndices(): unknown;
  owned(): unknown;
  isDecided(): unknown;
  resetStateTo(ref: IState | null, game: IGame): void;
}

/** Minimal surface of other.trial.Trial */
export interface ITrial {
  over(): boolean;
  ranking(): number[];
  status(): unknown;
  numMoves(): number;
  numInitialPlacementMoves(): number;
  numInitPlacement(): number;
  lastMove(): IMove | null;
  lastMove(player: number): IMove | null;
  lastTurnMover(moverId: number): number;
  reverseMoveIterator(): Iterator<IMove>;
  moveNumber(): number;
  reset(game: IGame): void;
  resetToTrial(other: ITrial): void;
  addMove(move: IMove): void;
  setStatus(status: unknown): void;
  setNumSubmovesPlayed(n: number): void;
  numSubmovesPlayed(): number;
  setLegalMoves(moves: IMoves, context: Context): void;
  addUndoData(data: unknown): void;
  auxilTrialData(): IAuxilTrialData | null;
  storeLegalMovesHistory(): void;
  storeLegalMovesHistorySizes(): void;
  previousStateWithinATurn(): unknown;
  previousState(): unknown;
}

export interface IAuxilTrialData {
  legalMovesHistory(): unknown[] | null;
  legalMovesHistorySizes(): unknown | null;
}

/** Minimal surface of other.move.Move */
export interface IMove {
  mover(): number;
  isPass(): boolean;
  fromNonDecision(): number;
  containsNextInstance?(): boolean;
  actions(): unknown[];
}

/** Minimal surface of game.rules.play.moves.Moves */
export interface IMoves {
  moves(): { size(): number; get(i: number): IMove; removeSwap(i: number): void; isEmpty(): boolean; add(m: IMove): void };
}

/** Minimal surface of other.model.Model */
export interface IModel {
  copy(): IModel;
  startNewStep(context: Context, ais: (IAI | null)[], maxSeconds: number): void;
}

export interface IAI {
  initAI(game: IGame, playerID: number): void;
  selectAction(game: IGame, context: Context, maxSeconds: number, maxIter: number, maxDepth: number): IMove;
  copyContext(context: Context): Context;
}

/** Minimal surface of game.Game */
export interface IGame {
  hasSubgames(): boolean;
  players(): { count(): number; players(): { get(i: number): { name(): string; enemies(): number[] } }; size(): number };
  rules(): { phases(): { length: number; [i: number]: { mode(): { createModel(): IModel } | null; playout(): unknown | null } }; };
  mode(): { createModel(): IModel };
  stateReference(): IState | null;
  instances(): { length: number; [i: number]: ISubgame };
  board(): { topology(): unknown; tracks(): unknown[] };
  equipment(): { containers(): unknown[]; components(): unknown[]; regions(): unknown[]; containerId(): number[]; sitesFrom(): number[] };
  handDice(): unknown[];
  isGraphGame(): boolean;
  isVertexGame(): boolean;
  isEdgeGame(): boolean;
  isCellGame(): boolean;
  isAlternatingMoveGame(): boolean;
  isStacking(): boolean;
  hasHandDice(): boolean;
  hiddenInformation(): boolean;
  requiresScore(): boolean;
  requiresPayoff(): boolean;
  hasSharedPlayer(): boolean;
  requiresTeams(): boolean;
  numContainers(): number;
  numComponents(): number;
  metadata(): unknown;
  endRules(): { eval(ctx: Context): void };
  moves(context: Context): IMoves;
  apply(context: Context, move: IMove): IMove;
  start(context: Context): void;
  board2?: () => { topology(): unknown; tracks(): unknown[] };
}

export interface ISubgame {
  getGame(): IGame | null;
  result(): { eval(ctx: Context): number } | null;
  next(): { eval(ctx: Context): number } | null;
}

/** simple RNG stub in lieu of SplitMix64 */
export interface IRng {
  nextLong(): number;
  saveState(): unknown;
  restoreState(state: unknown): void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const UNDEFINED_SITE = -1;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/**
 * Context for generating moves during playouts.
 *
 * @author cambolbro and Eric Piette (Java)
 * TypeScript transliteration – faithful 1:1 coverage; not wired to runtime.
 */
export class Context {
  // @java private final Game game;
  protected readonly _game: IGame;

  // @java private Context parentContext;
  protected _parentContext: Context | null;

  // @java private Context subcontext;
  protected _subcontext: Context | null;

  // @java protected transient State state;
  protected _state: IState | null;

  // @java private int currentSubgameIdx = 0;
  protected _currentSubgameIdx: number = 0;

  // @java private Model[] models;
  protected _models: IModel[];

  // @java private Trial trial;
  protected _trial: ITrial;

  // @java private List<Trial> completedTrials;
  protected _completedTrials: ITrial[];

  // @java private SplitMix64 rng;
  protected _rng: IRng;

  // @java private EvalContext evalContext = new EvalContext();
  protected _evalContext: EvalContext = new EvalContext();

  // @java private boolean recursiveCalled = false;
  protected _recursiveCalled: boolean = false;

  // @java private int numLossesDecided = 0;
  protected _numLossesDecided: number = 0;

  // @java private int numWinsDecided = 0;
  protected _numWinsDecided: number = 0;

  // @java private int[] scores;
  protected _scores: number[] | null;

  // @java private double[] payoffs;
  protected _payoffs: number[] | null;

  // @java private int active = 0;
  protected _active: number = 0;

  // @java private TIntArrayList winners;
  protected _winners: number[] = [];

  // @java private TIntArrayList losers;
  protected _losers: number[] = [];

  // @java private boolean haveStarted = false;
  protected _haveStarted: boolean = false;

  // @java final TIntIntHashMap diceSiteStates;
  readonly diceSiteStates: Map<number, number> = new Map();

  // -------------------------------------------------------------------------
  // Constructors
  // -------------------------------------------------------------------------

  /**
   * @java public Context(final Game game, final Trial trial)
   */
  constructor(game: IGame, trial: ITrial, rng?: IRng, parentContext?: Context | null) {
    this._game = game;
    this._parentContext = parentContext ?? null;
    this._trial = trial;
    this._completedTrials = [];
    this._rng = rng ?? makeDefaultRng();

    if (game.hasSubgames()) {
      // Match context
      this._state = null;
      const subgame = game.instances()[0]!.getGame()!;
      const subTrial = makeTrialForGame(subgame);
      this._subcontext = new Context(subgame, subTrial, this._rng, this);
      this._models = [makeMatchModel()];
    } else {
      // Single-game context
      this._state = game.stateReference() !== null ? copyState(game.stateReference()!) : null;
      this._subcontext = null;
      const phases = game.rules().phases();
      this._models = [];
      for (let i = 0; i < phases.length; i++) {
        const phaseMode = phases[i]?.mode() ?? null;
        this._models.push(phaseMode !== null ? phaseMode.createModel() : game.mode().createModel());
      }
    }

    this._scores  = game.requiresScore()  ? new Array<number>(game.players().count() + 1).fill(0) : null;
    this._payoffs = game.requiresPayoff() ? new Array<number>(game.players().count() + 1).fill(0) : null;

    for (let p = 1; p <= game.players().count(); p++) {
      this.setActive(p, true);
    }
  }

  /**
   * @java public Context(final Context other)  — copy constructor
   */
  static copyOf(other: Context): Context {
    return Context._copyFrom(other, null);
  }

  private static _copyFrom(other: Context, otherParentCopy: Context | null): Context {
    const c = Object.create(Context.prototype) as Context;
    (c as unknown as { _game: IGame })["_game"] = other._game;
    // _parentContext, _state, _trial etc. will be filled by _assignCopyFields
    (c as unknown as { diceSiteStates: Map<number,number> }).diceSiteStates = new Map();
    Context._assignCopyFields(c, other);
    c._parentContext = otherParentCopy;
    c._subcontext = other._subcontext !== null ? Context._copyFrom(other._subcontext, c) : null;
    return c;
  }

  /**
   * Static helper used by TempContext / InformationContext to bulk-assign
   * all mutable fields from a source context.  Mirrors the Java copy-
   * constructor body (minus game, parentContext, subcontext, diceSiteStates
   * which are handled externally).
   */
  static _assignCopyFields(target: Context, source: Context): void {
    target._parentContext     = source._parentContext;
    target._state             = source._state !== null ? copyState(source._state) : null;
    target._trial             = copyTrial(source._trial);
    target._completedTrials   = [...source._completedTrials];
    target._rng               = source._rng; // shared RNG (Java sharedRNG)
    target._currentSubgameIdx = source._currentSubgameIdx;
    target._models            = source._models.map((m: IModel) => m.copy());
    target._evalContext       = new EvalContext(source._evalContext);
    target._numLossesDecided  = source._numLossesDecided;
    target._numWinsDecided    = source._numWinsDecided;
    target._recursiveCalled   = source._recursiveCalled;
    target._scores            = source._scores  !== null ? [...source._scores]  : null;
    target._payoffs           = source._payoffs !== null ? [...source._payoffs] : null;
    target._active            = source._active;
    target._winners           = [...source._winners];
    target._losers            = [...source._losers];
    target._haveStarted       = source._haveStarted;
    target._subcontext        = source._subcontext; // will be overridden by _copyFrom
  }

  /** @java public Context deepCopy() */
  deepCopy(): Context {
    return Context._copyFrom(this, null);
  }

  // -------------------------------------------------------------------------
  // Reset
  // -------------------------------------------------------------------------

  /** @java public void reset() */
  reset(): void {
    if (this._state !== null) {
      this._state.resetStateTo(this._game.stateReference(), this._game);
    }
    this._trial.reset(this._game);

    if (this._scores  !== null) this._scores.fill(0);
    if (this._payoffs !== null) this._payoffs.fill(0);

    this._active = 0;
    for (let p = 1; p <= this._game.players().count(); p++) {
      this.setActive(p, true);
    }
    this._winners = [];
    this._losers  = [];
    this._haveStarted = true;

    if (this._subcontext !== null) {
      const subgame = this._game.instances()[0]!.getGame()!;
      this._subcontext = new Context(subgame, makeTrialForGame(subgame), this._rng, this);
      this._completedTrials = [];
    }
    this._currentSubgameIdx = 0;
  }

  // -------------------------------------------------------------------------
  // Active-player bitmask
  // -------------------------------------------------------------------------

  /** @java public void setActive(final int active) */
  setActiveBits(active: number): void { this._active = active; }

  /** @java public boolean active(final int who) */
  active(who?: number): boolean {
    if (who === undefined) return this._active !== 0;
    return (this._active & (1 << (who - 1))) !== 0;
  }

  /** @java public int onlyOneActive() */
  onlyOneActive(): number {
    if (exactlyOneBitSet(this._active)) return lowBitPos(this._active) + 1;
    return 0;
  }

  /** @java public int onlyOneTeamActive() */
  onlyOneTeamActive(): number {
    const activePlayers: number[] = [];
    for (let i = 1; i <= this._game.players().count(); i++) {
      if (this.active(i)) activePlayers.push(i);
    }
    const activeTeams: number[] = [];
    for (const pid of activePlayers) {
      const tid = this._state!.getTeam(pid);
      if (!activeTeams.includes(tid)) activeTeams.push(tid);
    }
    if (activeTeams.length !== 1) return 0;
    return activeTeams[0]!;
  }

  /** @java public void setActive(final int who, final boolean newActive) */
  setActive(who: number, newActive: boolean): void {
    if (this._state !== null) {
      this._active = this._state.setActive(who, newActive, this._active);
    } else {
      const whoBit = 1 << (who - 1);
      const wasActive = (this._active & whoBit) !== 0;
      if (wasActive && !newActive)   this._active &= ~whoBit;
      else if (!wasActive && newActive) this._active |= whoBit;
    }
  }

  /** @java public void setAllInactive() */
  setAllInactive(): void {
    this._active = 0;
    if (this._state !== null) this._state.updateHashAllPlayersInactive();
  }

  /** @java public int numActive() */
  numActive(): number {
    return bitCount(this._active);
  }

  // -------------------------------------------------------------------------
  // Winners / losers
  // -------------------------------------------------------------------------

  addWinner(idPlayer: number): void { this._winners.push(idPlayer); }
  addLoser(idPlayer: number): void  { this._losers.push(idPlayer); }

  numWinners(): number { return this._winners.length; }
  numLosers():  number { return this._losers.length;  }

  winners(): number[] { return this._winners; }
  losers():  number[] { return this._losers;  }

  // -------------------------------------------------------------------------
  // Scores and payoffs
  // -------------------------------------------------------------------------

  scores(): number[] | null  { return this._scores;  }
  payoffs(): number[] | null { return this._payoffs; }

  score(pid: number): number   { return this._scores![pid] ?? 0; }
  payoff(pid: number): number  { return this._payoffs![pid] ?? 0; }

  setScore(pid: number, scoreToSet: number): void {
    if (this._state !== null) this._state.setScore(pid, scoreToSet, this._scores!);
    else this._scores![pid] = scoreToSet;
  }

  setPayoff(pid: number, payoffToSet: number): void {
    if (this._state !== null) this._state.setPayoff(pid, payoffToSet, this._payoffs!);
    else this._payoffs![pid] = payoffToSet;
  }

  // -------------------------------------------------------------------------
  // Rank helpers
  // -------------------------------------------------------------------------

  computeNextWinRank(): number  { return this.numWinners() + 1; }
  computeNextLossRank(): number {
    const numRanks = this._trial.ranking().length - 1;
    return numRanks - this.numLosers();
  }
  computeNextDrawRank(): number {
    return (this.numActive() + 1) / 2.0 + this.numWinners();
  }

  // -------------------------------------------------------------------------
  // Accessors
  // -------------------------------------------------------------------------

  game():    IGame              { return this._game;    }
  trial():   ITrial             { return this._trial;   }
  isAMatch(): boolean           { return this._game.hasSubgames(); }

  model(): IModel {
    if (this._models.length === 1) return this._models[0]!;
    return this._models[this._state!.currentPhase(this._state!.mover())]!;
  }

  players() { return this._game.players().players(); }

  getNotes(player: number): string[] {
    // @java iterates last move actions looking for ActionNote
    // Deferred: requires full Action subsystem
    const notes: string[] = [];
    const lastMove = this._trial.lastMove(player);
    if (lastMove === null) return notes;
    // NOTE: full implementation deferred — needs ActionNote type check
    return notes;
  }

  subcontext(): Context | null { return this._subcontext; }

  currentInstanceContext(): Context {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let ctx: Context = this;
    while (ctx.isAMatch()) ctx = ctx.subcontext()!;
    return ctx;
  }

  rng(): IRng { return this._rng; }

  // -------------------------------------------------------------------------
  // EvalContext delegation
  // -------------------------------------------------------------------------

  evalContext(): EvalContext { return this._evalContext; }

  team(): number[] | null     { return this._evalContext.team(); }
  setTeam(t: number[]): void  { this._evalContext.setTeam(t); }

  from(): number              { return this._evalContext.from(); }
  setFrom(v: number): void    { this._evalContext.setFrom(v); }

  setTrack(v: number): void   { this._evalContext.setTrack(v); }
  track(): number             { return this._evalContext.track(); }

  to(): number                { return this._evalContext.to(); }
  setTo(v: number): void      { this._evalContext.setTo(v); }

  between(): number           { return this._evalContext.between(); }
  setBetween(v: number): void { this._evalContext.setBetween(v); }

  player(): number            { return this._evalContext.player(); }
  setPlayer(v: number): void  { this._evalContext.setPlayer(v); }

  pipCount(): number          { return this._evalContext.pipCount(); }
  setPipCount(v: number): void{ this._evalContext.setPipCount(v); }

  level(): number             { return this._evalContext.level(); }
  setLevel(v: number): void   { this._evalContext.setLevel(v); }

  hint(): number              { return this._evalContext.hint(); }
  setHint(v: number): void    { this._evalContext.setHint(v); }

  edge(): number              { return this._evalContext.edge(); }
  setEdge(v: number): void    { this._evalContext.setEdge(v); }

  site(): number              { return this._evalContext.site(); }
  setSite(v: number): void    { this._evalContext.setSite(v); }

  value(): number             { return this._evalContext.value(); }
  setValue(v: number): void   { this._evalContext.setValue(v); }

  region(): Region | null                 { return this._evalContext.region(); }
  setRegion(r: Region | null): void       { this._evalContext.setRegion(r); }

  hintRegion(): RegionFunction | null               { return this._evalContext.hintRegion(); }
  setHintRegion(r: RegionFunction | null): void     { this._evalContext.setHintRegion(r); }

  // -------------------------------------------------------------------------
  // numLosses/numWins decided
  // -------------------------------------------------------------------------

  numLossesDecided(): number    { return this._numLossesDecided; }
  numWinsDecided(): number      { return this._numWinsDecided; }

  setNumLossesDecided(v: number): void { this._numLossesDecided = v; }
  setNumWinsDecided(v: number): void   { this._numWinsDecided = v; }

  haveStarted(): boolean { return this._haveStarted; }

  // -------------------------------------------------------------------------
  // Game-delegation shortcuts
  // -------------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  containers(): any  { return this._subcontext !== null ? this._subcontext.containers()  : this._game.equipment().containers(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components(): any  { return this._subcontext !== null ? this._subcontext.components()  : this._game.equipment().components(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tracks(): any      { return this._subcontext !== null ? this._subcontext.tracks()      : this._game.board().tracks(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  regions(): any     { return this._subcontext !== null ? this._subcontext.regions()     : this._game.equipment().regions(); }
  containerId(): number[] { return this._subcontext !== null ? this._subcontext.containerId() : this._game.equipment().containerId(); }
  sitesFrom(): number[]   { return this._subcontext !== null ? this._subcontext.sitesFrom()   : this._game.equipment().sitesFrom(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  board(): any       { return this._subcontext !== null ? this._subcontext.board()       : this._game.board(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rules(): any       { return this._subcontext !== null ? this._subcontext.rules()       : this._game.rules(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata(): any    { return this._subcontext !== null ? this._subcontext.metadata()    : this._game.metadata(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  equipment(): any   { return this._subcontext !== null ? this._subcontext.equipment()   : this._game.equipment(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handDice(): any    { return this._subcontext !== null ? this._subcontext.handDice()    : this._game.handDice(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topology(): any    { return this._subcontext !== null ? this._subcontext.topology()    : (this._game.board() as unknown as { topology(): unknown }).topology(); }

  hasSharedPlayer(): boolean  { return this._subcontext !== null ? this._subcontext.hasSharedPlayer()  : this._game.hasSharedPlayer(); }
  numContainers(): number     { return this._subcontext !== null ? this._subcontext.numContainers()    : this._game.numContainers(); }
  numComponents(): number     { return this._subcontext !== null ? this._subcontext.numComponents()    : this._game.numComponents(); }

  state(): IState | null {
    if (this._subcontext !== null) return this._subcontext.state();
    return this._state;
  }

  getPlayerName(p: number): string {
    if (this._subcontext !== null) return this._subcontext.getPlayerName(p);
    return this._game.players().players().get(this.state()!.playerToAgent(p)).name();
  }

  isGraphGame():  boolean { return this._subcontext !== null ? this._subcontext.isGraphGame()  : this._game.isGraphGame(); }
  isVertexGame(): boolean { return this._subcontext !== null ? this._subcontext.isVertexGame() : this._game.isVertexGame(); }
  isEdgeGame():   boolean { return this._subcontext !== null ? this._subcontext.isEdgeGame()   : this._game.isEdgeGame(); }
  isCellGame():   boolean { return this._subcontext !== null ? this._subcontext.isCellGame()   : this._game.isCellGame(); }

  containerState(cid: number): unknown {
    if (this._subcontext !== null) return this._subcontext.containerState(cid);
    const cs = this.state()?.containerStates() as unknown as unknown[];
    return cid < cs.length ? cs[cid] : null;
  }

  // -------------------------------------------------------------------------
  // allPass
  // -------------------------------------------------------------------------

  /**
   * @java public boolean allPass()
   * Deferred: full logic needs reverseMoveIterator with stateful mover tracking.
   * Structural stub is provided; logic returns false (safe default).
   */
  allPass(): boolean {
    if (this._subcontext !== null) return this._subcontext.allPass();
    // DEFERRED: full reverse-iterator traversal
    return false;
  }

  // -------------------------------------------------------------------------
  // Parent / completed trials
  // -------------------------------------------------------------------------

  parentContext(): Context | null   { return this._parentContext; }
  completedTrials(): ITrial[]       { return this._completedTrials; }

  // -------------------------------------------------------------------------
  // convertRole
  // -------------------------------------------------------------------------

  /**
   * @java public TIntArrayList convertRole(final RoleType role)
   * DEFERRED: requires RoleType enum + Id ludeme eval.
   */
  convertRole(_role: unknown): number[] {
    // DEFERRED
    return [];
  }

  // -------------------------------------------------------------------------
  // recursiveCalled
  // -------------------------------------------------------------------------

  recursiveCalled(): boolean                { return this._recursiveCalled; }
  setRecursiveCalled(value: boolean): void  { this._recursiveCalled = value; }

  // -------------------------------------------------------------------------
  // fromStartOfTurn
  // -------------------------------------------------------------------------

  fromStartOfTurn(): number {
    if (this._trial.numMoves() === 0) return UNDEFINED_SITE;
    const it = this._trial.reverseMoveIterator();
    const mover = this._state!.mover();
    let cur = it.next();
    if (cur.done) return UNDEFINED_SITE;
    let currMove: IMove = cur.value;
    if (mover !== currMove.mover()) return UNDEFINED_SITE;
    let fromStartOfTurn = currMove.fromNonDecision();
    while (true) {
      cur = it.next();
      if (cur.done) break;
      currMove = cur.value;
      if (currMove.mover() !== mover) break;
      fromStartOfTurn = currMove.fromNonDecision();
    }
    return fromStartOfTurn;
  }

  // -------------------------------------------------------------------------
  // currentSubgameIdx / advanceInstance
  // -------------------------------------------------------------------------

  currentSubgameIdx(): number { return this._currentSubgameIdx; }

  /**
   * @java public void advanceInstance()
   * DEFERRED: requires MatchModel.resetCurrentInstanceModel() + Subgame +
   * full IntFunction eval. Structural stub provided.
   */
  advanceInstance(): void {
    // DEFERRED: full match-advance logic needs MatchModel + Subgame subsystems
    throw new Error("Context.advanceInstance: deferred – requires MatchModel + Subgame subsystems");
  }

  // -------------------------------------------------------------------------
  // moves / pointOfView
  // -------------------------------------------------------------------------

  moves(context: Context): IMoves { return context._game.moves(context); }

  pointofView(): number { return this.state()!.mover(); }

  // -------------------------------------------------------------------------
  // resetToContext
  // -------------------------------------------------------------------------

  resetToContext(context: Context): void {
    this._parentContext = context._parentContext;
    this._state!.resetStateTo(context._state, this._game);
    this._trial.resetToTrial(context._trial);
    this._completedTrials = [...context._completedTrials];
    this._subcontext = context._subcontext !== null ? Context._copyFrom(context._subcontext, this) : null;
    this._currentSubgameIdx = context._currentSubgameIdx;
    this._models = context._models.map(m => m.copy());
    this._evalContext = new EvalContext(context._evalContext);
    this._numLossesDecided = context._numLossesDecided;
    this._numWinsDecided   = context._numWinsDecided;
    this._recursiveCalled  = context._recursiveCalled;
    this._scores  = context._scores  !== null ? [...context._scores]  : null;
    this._payoffs = context._payoffs !== null ? [...context._payoffs] : null;
    this._active  = context._active;
    this._winners = [...context._winners];
    this._losers  = [...context._losers];
  }

  diceSiteState(): Map<number, number> { return this.diceSiteStates; }

  /**
   * @java public void storeCurrentData()
   * DEFERRED: requires UndoData class.
   */
  storeCurrentData(): void {
    // DEFERRED: requires UndoData + full state accessors
    throw new Error("Context.storeCurrentData: deferred – requires UndoData");
  }

  // -------------------------------------------------------------------------
  // setMoverAndImpliedPrevAndNext
  // -------------------------------------------------------------------------

  setMoverAndImpliedPrevAndNext(newMover: number): void {
    this._state!.setMover(newMover);

    let next = newMover % this._game.players().count() + 1;
    while (!this.active(next)) {
      next++;
      if (next > this._game.players().count()) next = 1;
    }
    this._state!.setNext(next);

    let prev = newMover - 1;
    if (prev < 1) prev = this._game.players().count();
    while (!this.active(prev)) {
      prev--;
      if (prev < 1) prev = this._game.players().count();
    }
    this._state!.setPrev(prev);
  }

  // -------------------------------------------------------------------------
  // Virtual copy helpers (overridable in TempContext)
  // -------------------------------------------------------------------------

  /**
   * @java protected State copyState(final State otherState)
   * Override in TempContext to return CopyOnWriteState.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected copyState(otherState: IState | null): IState | null {
    return otherState !== null ? copyState(otherState) : null;
  }

  /**
   * @java protected Trial copyTrial(final Trial otherTrial)
   * Override in TempContext to return TempTrial.
   */
  protected copyTrial(otherTrial: ITrial): ITrial {
    return copyTrial(otherTrial);
  }
}

// ---------------------------------------------------------------------------
// Helpers (in lieu of Java static utilities)
// ---------------------------------------------------------------------------

function exactlyOneBitSet(v: number): boolean {
  return v !== 0 && (v & (v - 1)) === 0;
}

function lowBitPos(v: number): number {
  // position of lowest set bit (0-indexed)
  let pos = 0;
  while ((v & 1) === 0) { v >>= 1; pos++; }
  return pos;
}

function bitCount(v: number): number {
  let count = 0;
  let n = v >>> 0;
  while (n) { count += n & 1; n >>>= 1; }
  return count;
}

/** Placeholder factories – callers should supply real implementations */
function makeDefaultRng(): IRng {
  let seed = Date.now();
  return {
    nextLong() { seed = (seed * 6364136223846793005 + 1442695040888963407) | 0; return seed; },
    saveState() { return seed; },
    restoreState(s: unknown) { seed = s as number; }
  };
}

/** Placeholder – must be overridden with real factory in actual usage */
function makeTrialForGame(_game: IGame): ITrial {
  throw new Error("makeTrialForGame: provide a real Trial factory");
}

function makeMatchModel(): IModel {
  throw new Error("makeMatchModel: provide MatchModel");
}

function copyState(s: IState): IState {
  // Deferred: real implementation lives in State class
  return s; // shallow copy stub
}

function copyTrial(t: ITrial): ITrial {
  // Deferred: real implementation lives in Trial class
  return t; // shallow copy stub
}

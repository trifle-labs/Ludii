// @java Core/src/other/UndoData.java UndoData
/**
 * Faithful 1:1 transliteration of other.UndoData.
 *
 * UndoData is a plain data-holder for all state that must be restored when a
 * move is undone.  Every field and getter is ported exactly; the constructor
 * performs the same defensive copies the Java constructor does.
 *
 * Deferrals / Java-specific types replaced by minimal TS equivalents:
 *  - TIntArrayList  → number[]   (Trove primitive int list)
 *  - TLongArrayList → bigint[]   (Trove primitive long list)
 *  - TIntHashSet    → Set<number>
 *  - FastTIntArrayList → number[] (same underlying contract)
 *  - BitSet         → Uint8Array  (bit-addressable, same clone semantics)
 *  - Status         → IStatus     (opaque interface with copy constructor shape)
 *  - OnTrackIndices → IOnTrackIndices (opaque copy-constructible interface)
 *  - Owned          → IOwned      (opaque copy-constructible interface)
 *
 * @author Eric.Piette (Java original)
 * @java other.UndoData
 */

// ---------------------------------------------------------------------------
// Minimal opaque interfaces for types that live in other engine modules.
// ---------------------------------------------------------------------------

/** Minimal surface of main.Status */
export interface IStatus {
  /** Copy constructor shape used in constructor body */
  copy?(): IStatus;
}

/** Minimal surface of other.state.track.OnTrackIndices */
export interface IOnTrackIndices {
  copy(): IOnTrackIndices;
}

/** Minimal surface of other.state.owned.Owned */
export interface IOwned {
  copy(): IOwned;
}

// ---------------------------------------------------------------------------
// UndoData
// ---------------------------------------------------------------------------

/**
 * Undo Data necessary to be able to undo a move.
 *
 * @java other.UndoData
 */
export class UndoData {
  // ----------------------Data modified by end rules--------------------------

  /** Ranking of the players. @java UndoData#ranking */
  private readonly ranking: number[];

  /** Result of game (null if game is still in progress). @java UndoData#status */
  private readonly status: IStatus | null;

  /** List of players who've already won @java UndoData#winners (TIntArrayList) */
  private readonly winners: number[];

  /** List of players who've already lost @java UndoData#losers (TIntArrayList) */
  private readonly losers: number[];

  /** For every player, a bit indicating whether they are active @java UndoData#active */
  private active: number = 0;

  /** Scores per player. @java UndoData#scores */
  private readonly scores: number[] | null;

  /** Payoffs per player. @java UndoData#payoffs */
  private readonly payoffs: number[] | null;

  /**
   * Data used during computation of ranking in case of multi results in the
   * same turn.
   * @java UndoData#numLossesDecided
   */
  private numLossesDecided: number = 0;

  /** Same as above, but for wins @java UndoData#numWinsDecided */
  private numWinsDecided: number = 0;

  // ---------------------Data modified in game.apply()------------------------

  /** The current phase of each player. @java UndoData#phases */
  private readonly phases: number[] | null;

  /** The pending values. @java UndoData#pendingValues (TIntHashSet) */
  private readonly pendingValues: Set<number> | null;

  /** The counter. @java UndoData#counter */
  private readonly counter: number;

  /** The previous state in the same turn. @java UndoData#previousStateWithinATurn (TLongArrayList) */
  private readonly previousStateWithinATurn: bigint[];

  /** The previous state in case of no repetition rule. @java UndoData#previousState (TLongArrayList) */
  private readonly previousState: bigint[];

  /** The index of the previous player. @java UndoData#prev */
  private readonly prev: number;

  /** The index of the mover. @java UndoData#mover */
  private readonly mover: number;

  /** The index of the next player. @java UndoData#next */
  private readonly next: number;

  /** The number of times the mover has been switched to a different player. @java UndoData#numTurn */
  private readonly numTurn: number;

  /** The number of turns played successively by the same player. @java UndoData#numTurnSamePlayer */
  private readonly numTurnSamePlayer: number;

  /** Number of consecutive pass moves. @java UndoData#numConsecutivePasses */
  private numConsecutivePasses: number = 0;

  /** All the remaining dominoes. @java UndoData#remainingDominoes (FastTIntArrayList) */
  private remainingDominoes: number[] | null;

  /** The decision after voting. @java UndoData#isDecided */
  private isDecided: number;

  /**
   * BitSet used to store all the sites already visited (from & to) by each move
   * done by the player in a sequence of turns played by the same player.
   * @java UndoData#visited (BitSet → Uint8Array)
   */
  private visited: Uint8Array | null = null;

  /** In case of a sequence of captures to remove. @java UndoData#sitesToRemove (TIntArrayList) */
  private sitesToRemove: number[] | null = null;

  /** To access where are each type of piece on each track. @java UndoData#onTrackIndices */
  private onTrackIndices: IOnTrackIndices | null;

  /** To access where are each type of piece on each track. @java UndoData#owned */
  private owned: IOwned | null;

  // -------------------------------------------------------------------------

  /**
   * @param ranking                  The ranking of the players.
   * @param status                   The status of the game.
   * @param winners                  The players who've already won.
   * @param losers                   The players who've already lost.
   * @param active                   For every player, a bit indicating whether they are active.
   * @param scores                   Scores per player.
   * @param payoffs                  Payoffs per player.
   * @param numLossesDecided         Number of losses decided.
   * @param numWinsDecided           Number of wins decided.
   * @param phases                   The phases of each player.
   * @param pendingValues            The pending values.
   * @param counter                  The counter of the state.
   * @param previousStateWithinATurn The previous state in the same turn.
   * @param previousState            The previous state in case of no repetition rule.
   * @param prev                     The index of the previous player.
   * @param mover                    The index of the mover.
   * @param next                     The index of the next player.
   * @param numTurn                  The number of turns.
   * @param numTurnSamePlayer        The number of moves played so far in the same turn.
   * @param numConsecutivePasses     Number of consecutive pass moves.
   * @param remainingDominoes        All the remaining dominoes.
   * @param visited                  Sites visited during the same turn.
   * @param sitesToRemove            Sites to remove in case of a sequence of capture.
   * @param onTrackIndices           To access where are each type of piece on each track.
   * @param owned                    Access to list of sites for each kind of component owned per player.
   * @param isDecided                The decision after voting.
   * @java UndoData constructor
   */
  constructor(
    ranking: number[],
    status: IStatus | null,
    winners: number[],
    losers: number[],
    active: number,
    scores: number[] | null,
    payoffs: number[] | null,
    numLossesDecided: number,
    numWinsDecided: number,
    phases: number[] | null,
    pendingValues: Set<number> | null,
    counter: number,
    previousStateWithinATurn: bigint[],
    previousState: bigint[],
    prev: number,
    mover: number,
    next: number,
    numTurn: number,
    numTurnSamePlayer: number,
    numConsecutivePasses: number,
    remainingDominoes: number[] | null,
    visited: Uint8Array | null,
    sitesToRemove: number[] | null,
    onTrackIndices: IOnTrackIndices | null,
    owned: IOwned | null,
    isDecided: number
  ) {
    // Java: Arrays.copyOf(ranking, ranking.length)
    this.ranking = ranking.slice();
    // Java: status == null ? null : new Status(status)
    this.status = status === null ? null : (status.copy ? status.copy() : { ...status });
    // Java: new TIntArrayList(winners)
    this.winners = winners.slice();
    // Java: new TIntArrayList(losers)
    this.losers = losers.slice();
    this.active = active;
    // Java: scores == null ? null : Arrays.copyOf(scores, scores.length)
    this.scores = scores === null ? null : scores.slice();
    // Java: payoffs == null ? null : Arrays.copyOf(payoffs, payoffs.length)
    this.payoffs = payoffs === null ? null : payoffs.slice();
    this.numLossesDecided = numLossesDecided;
    this.numWinsDecided = numWinsDecided;
    // Java: phases == null ? null : Arrays.copyOf(phases, phases.length)
    this.phases = phases === null ? null : phases.slice();
    // Java: pendingValues == null ? null : new TIntHashSet(pendingValues)
    this.pendingValues = pendingValues === null ? null : new Set(pendingValues);
    this.counter = counter;
    // Java: new TLongArrayList(previousStateWithinATurn)
    this.previousStateWithinATurn = previousStateWithinATurn.slice();
    // Java: new TLongArrayList(previousState)
    this.previousState = previousState.slice();
    this.prev = prev;
    this.mover = mover;
    this.next = next;
    this.numTurn = numTurn;
    this.numTurnSamePlayer = numTurnSamePlayer;
    this.numConsecutivePasses = numConsecutivePasses;
    // Java: remainingDominoes == null ? null : new FastTIntArrayList(remainingDominoes)
    this.remainingDominoes = remainingDominoes === null ? null : remainingDominoes.slice();
    // Java: visited == null ? null : (BitSet) visited.clone()
    this.visited = visited === null ? null : visited.slice();
    // Java: sitesToRemove == null ? null : new TIntArrayList(sitesToRemove)
    this.sitesToRemove = sitesToRemove === null ? null : sitesToRemove.slice();
    // Java: onTrackIndices == null ? null : new OnTrackIndices(onTrackIndices)
    this.onTrackIndices = onTrackIndices === null ? null : onTrackIndices.copy();
    // Java: owned == null ? null : owned.copy()
    this.owned = owned === null ? null : owned.copy();
    this.isDecided = isDecided;
  }

  // -------------------------------------------------------------------------

  /**
   * @returns The ranking.
   * @java UndoData#ranking
   */
  getRanking(): number[] {
    return this.ranking;
  }

  /**
   * @returns The status.
   * @java UndoData#status
   */
  getStatus(): IStatus | null {
    return this.status;
  }

  /**
   * @returns The winners.
   * @java UndoData#winners
   */
  getWinners(): number[] {
    return this.winners;
  }

  /**
   * @returns The losers.
   * @java UndoData#losers
   */
  getLosers(): number[] {
    return this.losers;
  }

  /**
   * @returns For each player a bit to indicate each player is active.
   * @java UndoData#active
   */
  getActive(): number {
    return this.active;
  }

  /**
   * @returns The scores of each player.
   * @java UndoData#scores
   */
  getScores(): number[] | null {
    return this.scores;
  }

  /**
   * @returns The payoffs of each player.
   * @java UndoData#payoffs
   */
  getPayoffs(): number[] | null {
    return this.payoffs;
  }

  /**
   * @returns The number of losses decided.
   * @java UndoData#numLossesDecided
   */
  getNumLossesDecided(): number {
    return this.numLossesDecided;
  }

  /**
   * @returns The number of wins decided.
   * @java UndoData#numWinsDecided
   */
  getNumWinsDecided(): number {
    return this.numWinsDecided;
  }

  /**
   * @returns The phase of each player.
   * @java UndoData#phases
   */
  getPhases(): number[] | null {
    return this.phases;
  }

  /**
   * @returns The pending values.
   * @java UndoData#pendingValues
   */
  getPendingValues(): Set<number> | null {
    return this.pendingValues;
  }

  /**
   * @returns The counter.
   * @java UndoData#counter
   */
  getCounter(): number {
    return this.counter;
  }

  /**
   * @returns The previous state in the same turn.
   * @java UndoData#previousStateWithinATurn
   */
  getPreviousStateWithinATurn(): bigint[] {
    return this.previousStateWithinATurn;
  }

  /**
   * @returns The previous state in case of no repetition rule.
   * @java UndoData#previousState
   */
  getPreviousState(): bigint[] {
    return this.previousState;
  }

  /**
   * @returns The index of the previous player.
   * @java UndoData#prev
   */
  getPrev(): number {
    return this.prev;
  }

  /**
   * @returns The index of the mover.
   * @java UndoData#mover
   */
  getMover(): number {
    return this.mover;
  }

  /**
   * @returns The index of the next player.
   * @java UndoData#next
   */
  getNext(): number {
    return this.next;
  }

  /**
   * @returns The number of times the mover has been switched to a different player.
   * @java UndoData#numTurn
   */
  getNumTurn(): number {
    return this.numTurn;
  }

  /**
   * @returns The number of turns played successively by the same player.
   * @java UndoData#numTurnSamePlayer
   */
  getNumTurnSamePlayer(): number {
    return this.numTurnSamePlayer;
  }

  /**
   * @returns Number of consecutive pass moves.
   * @java UndoData#numConsecutivePasses
   */
  getNumConsecutivePasses(): number {
    return this.numConsecutivePasses;
  }

  /**
   * @returns All the remaining dominoes.
   * @java UndoData#remainingDominoes
   */
  getRemainingDominoes(): number[] | null {
    return this.remainingDominoes;
  }

  /**
   * @returns Sites visited during the same turn.
   * @java UndoData#visited
   */
  getVisited(): Uint8Array | null {
    return this.visited;
  }

  /**
   * @returns Sites to remove in case of a sequence of capture.
   * @java UndoData#sitesToRemove
   */
  getSitesToRemove(): number[] | null {
    return this.sitesToRemove;
  }

  /**
   * @returns To access where are each type of piece on each track.
   * @java UndoData#onTrackIndices
   */
  getOnTrackIndices(): IOnTrackIndices | null {
    return this.onTrackIndices;
  }

  /**
   * @returns Owned sites per component
   * @java UndoData#owned
   */
  getOwned(): IOwned | null {
    return this.owned;
  }

  /**
   * @returns The decision after voting.
   * @java UndoData#isDecided
   */
  getIsDecided(): number {
    return this.isDecided;
  }
}

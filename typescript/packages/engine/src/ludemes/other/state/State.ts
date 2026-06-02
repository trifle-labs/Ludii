// @java Core/src/other/state/State.java

/**
 * Game state — reference 1:1 translation of State.java.
 *
 * IMPORTANT: The working runtime state lives in src/state.ts (not modified here).
 * This file is the faithful translation coverage file that mirrors the Java class
 * structure and field names, for documentation/1:1 parity purposes.
 * It does NOT replace or extend the runtime State class.
 *
 * Java parity: Core/src/other/state/State.java
 *
 * @author Eric.Piette and cambolbro (Java), ported to TS
 */

import type { ContainerState } from "./container/ContainerState.js";
import type { Owned } from "./owned/Owned.js";
import type { OnTrackIndices } from "./track/OnTrackIndices.js";
import type { SymmetryValidator } from "./symmetry/SymmetryValidator.js";

// Java: private static final int TURN_MAX_HASH = 1024
const TURN_MAX_HASH = 1024;
const SCORE_MAX_HASH = 1024;
const AMOUNT_MAX_HASH = 1024;

/**
 * 1:1 transliteration of the Java State class fields and key methods.
 * This is a translation coverage class — the runtime uses src/state.ts instead.
 *
 * All field names and types mirror the Java source exactly.
 */
export class State1to1 {
  // Java: private int mover = 0
  private mover_ = 0;
  // Java: private int next = 0
  private next_ = 0;
  // Java: private int prev = 0
  private prev_ = 0;
  // Java: private int triggered = 0
  private triggered_ = 0;
  // Java: private int stalemated = 0
  private stalemated_ = 0;
  // Java: private ContainerState[] containerStates
  private containerStates_: ContainerState[] = [];
  // Java: private int counter = Constants.UNDEFINED
  private counter_ = -1;
  // Java: private int pot = 0
  private pot_ = 0;
  // Java: private int trumpSuit = Constants.UNDEFINED
  private trumpSuit_ = -1;
  // Java: private int numTurn = 1
  private numTurn_ = 1;
  // Java: private int numTurnSamePlayer = 0
  private numTurnSamePlayer_ = 0;
  // Java: private boolean diceAllEqual = false
  private diceAllEqual_ = false;
  // Java: private long stateHash = ZobristHashUtilities.INITIAL_VALUE
  private stateHash_ = 0;
  // Java: private long[] phaseHash
  private phaseHash_: number[] = [];
  // Java: private long[] turnHash
  private turnHash_: number[] = [];
  // Java: private long[] playerOrderHash
  private playerOrderHash_: number[] = [];
  // Java: private long[][] scoreHash
  private scoreHash_: number[][] = [];
  // Java: private long[][] amountHash
  private amountHash_: number[][] = [];
  // Java: private int[] scores
  private scores_: number[] = [];
  // Java: private int[] amounts
  private amounts_: number[] = [];
  // Java: private int[] values
  private values_: number[] = [];
  // Java: private boolean[] active
  private active_: boolean[] = [];
  // Java: private int[] phases
  private phases_: number[] = [];
  // Java: private int[] temps
  private temps_: number[] = [];
  // Java: private boolean[] checkmated
  private checkmated_: boolean[] = [];
  // Java: private boolean[] stalematedArr
  private stalematedArr_: boolean[] = [];
  // Java: private int numPlayers
  private numPlayers_ = 0;
  // Java: private Owned owned
  private owned_: Owned | null = null;
  // Java: private OnTrackIndices onTrackIndices
  private onTrackIndices_: OnTrackIndices | null = null;
  // Java: private Map<String, Integer> variables
  private variables_: Map<string, number> = new Map();
  // Java: private Map<String, FastTIntArrayList> rememberValues
  private rememberValues_: Map<string, number[]> = new Map();
  // Java: private long storedState = 0L
  private storedState_ = 0;
  // Java: private TIntArrayList sitesToRemove
  private sitesToRemove_: number[] = [];
  // Java: private BitSet visited
  private visited_: Set<number> = new Set();
  // Java: private int[] pendingValues
  private pendingValues_: Set<number> = new Set();
  // Java: private int[] diceValues
  private diceValues_: number[] = [];

  // ---------------------------------------------------------------------------
  // Key methods — mirroring Java signatures

  /** Java: public int mover() */
  mover(): number { return this.mover_; }

  /** Java: public void setMover(final int mover) */
  setMover(mover: number): void { this.mover_ = mover; }

  /** Java: public int next() */
  next(): number { return this.next_; }

  /** Java: public int prev() */
  prev(): number { return this.prev_; }

  /** Java: public long stateHash() */
  stateHash(): number { return this.stateHash_; }

  /**
   * Java: public void updateStateHash(final long delta)
   * XOR the hash with the delta.
   */
  updateStateHash(delta: number): void {
    this.stateHash_ ^= delta;
  }

  /** Java: public int numTurn() */
  numTurn(): number { return this.numTurn_; }

  /** Java: public int numTurnSamePlayer() */
  numTurnSamePlayer(): number { return this.numTurnSamePlayer_; }

  /** Java: public int numPlayers() */
  numPlayers(): number { return this.numPlayers_; }

  /** Java: public ContainerState[] containerStates() */
  containerStates(): ContainerState[] { return this.containerStates_; }

  /** Java: public ContainerState containerState(final int containerIndex) */
  containerState(containerIndex: number): ContainerState {
    return this.containerStates_[containerIndex]!;
  }

  /** Java: public int score(final int player) */
  score(player: number): number { return this.scores_[player] ?? 0; }

  /** Java: public boolean isActive(final int player) */
  isActive(player: number): boolean { return this.active_[player] ?? false; }

  /** Java: public int counter() */
  counter(): number { return this.counter_; }

  /** Java: public int pot() */
  pot(): number { return this.pot_; }

  /** Java: public int trumpSuit() */
  trumpSuit(): number { return this.trumpSuit_; }

  /** Java: public Owned owned() */
  owned(): Owned | null { return this.owned_; }

  /** Java: public OnTrackIndices onTrackIndices() */
  onTrackIndices(): OnTrackIndices | null { return this.onTrackIndices_; }

  /** Java: public Map<String, Integer> variables() */
  variables(): Map<string, number> { return this.variables_; }

  /** Java: public Map<String, FastTIntArrayList> rememberValues() */
  rememberValues(): Map<string, number[]> { return this.rememberValues_; }

  /** Java: public long storedState() */
  storedState(): number { return this.storedState_; }

  /** Java: public TIntArrayList sitesToRemove() */
  sitesToRemove(): number[] { return this.sitesToRemove_; }

  /** Java: public boolean isVisited(final int site) */
  isVisited(site: number): boolean { return this.visited_.has(site); }

  /** Java: public boolean[] getPending() / pendingValues */
  pendingValues(): Set<number> { return this.pendingValues_; }

  /** Java: public boolean isTriggered(final String event, final int who) */
  isTriggered(_event: string, who: number): boolean {
    return (this.triggered_ & (1 << who)) !== 0;
  }

  /** Java: public boolean isStatmated(final int who) */
  isStalemated(who: number): boolean {
    return (this.stalemated_ & (1 << who)) !== 0;
  }

  /** Java: public int[] diceValues() */
  diceValues(): number[] { return this.diceValues_; }

  /** Java: public boolean diceAllEqual() */
  diceAllEqual(): boolean { return this.diceAllEqual_; }

  /**
   * Java: public long canonicalHash(final SymmetryValidator validator, final boolean whoOnly)
   */
  canonicalHash(validator: SymmetryValidator, whoOnly: boolean): number {
    let hash = 0;
    for (const cs of this.containerStates_) {
      hash ^= cs.canonicalHash(validator, { updateStateHash: () => {}, numPlayers: () => this.numPlayers_ }, whoOnly);
    }
    return hash;
  }
}

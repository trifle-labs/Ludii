// @java AI/src/training/expert_iteration/ExItExperience.java

/**
 * A single sample of experience for Expert Iteration.
 * Contains a trial, a list of actions, a distribution
 * over those actions resulting from an MCTS search process,
 * and value estimates per action as computed by MCTS.
 *
 * @java training.expert_iteration.ExItExperience
 * @author Dennis Soemers
 */

import type {
  BaseFeatureSet,
  BitSet,
  FastArrayList,
  FeatureInstance,
  FeatureVector,
  FVector,
  Move,
} from "../feature_discovery/FeatureSetExpander.js";

//-------------------------------------------------------------------------

/** @java other.context.Context — escape hatch */
type Context = {
  state(): { mover(): number };
  trial(): { lastMove(): Move | null };
};

/** @java other.state.State — escape hatch */
type State = {
  mover(): number;
};

/** @java features.spatial.FeatureUtils — escape hatch */
const FeatureUtils = null as unknown as {
  fromPos(move: Move): number;
  toPos(move: Move): number;
};

//-------------------------------------------------------------------------

/**
 * Wrapper class for game states in an ExIt experience buffer.
 * Contains game state + last decision move (which we need access
 * to for reactive features).
 *
 * @java training.expert_iteration.ExItExperience.ExItExperienceState
 * @author Dennis Soemers
 */
export class ExItExperienceState {

  //-------------------------------------------------------------------------

  /** @java ExItExperienceState.state */
  private readonly _state: State;

  /** @java ExItExperienceState.lastDecisionMove */
  private readonly _lastDecisionMove: Move | null;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java ExItExperienceState(Context)
   */
  public constructor(context: Context) {
    this._state = context.state() as unknown as State;
    this._lastDecisionMove = context.trial().lastMove();
  }

  //-------------------------------------------------------------------------

  /**
   * @return Game state
   * @java ExItExperienceState.state()
   */
  public state(): State {
    return this._state;
  }

  /**
   * @return Last decision move
   * @java ExItExperienceState.lastDecisionMove()
   */
  public lastDecisionMove(): Move | null {
    return this._lastDecisionMove;
  }

  //-------------------------------------------------------------------------

}

//-------------------------------------------------------------------------

/**
 * Abstract base for ExperienceSample — matches Java's training.ExperienceSample
 *
 * @java training.ExperienceSample
 */
export abstract class ExperienceSample {
  public abstract generateFeatureVectors(featureSet: BaseFeatureSet): FeatureVector[];
  public abstract expertDistribution(): FVector;
  public abstract gameState(): State;
  public abstract lastFromPos(): number;
  public abstract lastToPos(): number;
  public abstract moves(): FastArrayList<Move>;
  public abstract winningMoves(): BitSet;
  public abstract losingMoves(): BitSet;
  public abstract antiDefeatingMoves(): BitSet;
}

//-------------------------------------------------------------------------

/**
 * A single sample of experience for Expert Iteration.
 *
 * @java training.expert_iteration.ExItExperience
 */
export class ExItExperience extends ExperienceSample {

  //-------------------------------------------------------------------------

  /** @java ExItExperience.context (transient, not serialised) */
  protected readonly _context: Context;

  /** @java ExItExperience.state — game state + last decision move */
  protected readonly _state: ExItExperienceState;

  /** @java ExItExperience.moves — legal actions in the game state */
  protected readonly _moves: FastArrayList<Move>;

  /** @java ExItExperience.expertDistribution — distribution over actions by Expert */
  protected readonly _expertDistribution: FVector;

  /** @java ExItExperience.expertValueEstimates — value estimates from Expert */
  protected readonly _expertValueEstimates: FVector;

  /** @java ExItExperience.stateFeatureVector — feature vector for state (heuristic terms) */
  protected _stateFeatureVector: FVector | null = null;

  /** @java ExItExperience.episodeDuration */
  protected _episodeDuration: number = -1;

  /** @java ExItExperience.playerOutcomes */
  protected _playerOutcomes: number[] | null = null;

  /** @java ExItExperience.winningMoves */
  protected readonly _winningMoves: JsBitSet = new JsBitSet();

  /** @java ExItExperience.losingMoves */
  protected readonly _losingMoves: JsBitSet = new JsBitSet();

  /** @java ExItExperience.antiDefeatingMoves */
  protected readonly _antiDefeatingMoves: JsBitSet = new JsBitSet();

  /** @java ExItExperience.weightPER */
  protected _weightPER: number = -1;

  /** @java ExItExperience.weightCEExplore */
  protected _weightCEExplore: number = -1;

  /** @java ExItExperience.weightVisitCount */
  protected readonly _weightVisitCount: number;

  /** @java ExItExperience.bufferIdx */
  protected _bufferIdx: number = -1;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java ExItExperience(Context, ExItExperienceState, FastArrayList<Move>, FVector, FVector, float)
   */
  public constructor(
    context: Context,
    state: ExItExperienceState,
    moves: FastArrayList<Move>,
    expertDistribution: FVector,
    expertValueEstimates: FVector,
    weightVisitCount: number,
  ) {
    super();
    this._context = context;
    this._state = state;
    this._moves = moves;
    this._expertDistribution = expertDistribution;
    this._expertValueEstimates = expertValueEstimates;
    this._weightVisitCount = weightVisitCount;
  }

  //-------------------------------------------------------------------------

  /**
   * @return Context
   * @java ExItExperience.context()
   */
  public context(): Context {
    return this._context;
  }

  /**
   * @return state
   * @java ExItExperience.state()
   */
  public state2(): ExItExperienceState {
    return this._state;
  }

  /**
   * @java ExItExperience.moves()
   */
  public override moves(): FastArrayList<Move> {
    return this._moves;
  }

  /**
   * @return The index in replay buffer from which we sampled this if using PER
   * @java ExItExperience.bufferIdx()
   */
  public bufferIdx(): number {
    return this._bufferIdx;
  }

  /**
   * @java ExItExperience.expertDistribution()
   */
  public override expertDistribution(): FVector {
    const adjustedExpertDistribution = this._expertDistribution.copy();

    if (
      !this._winningMoves.isEmpty() ||
      !this._losingMoves.isEmpty() ||
      !this._antiDefeatingMoves.isEmpty()
    ) {
      const maxVal = adjustedExpertDistribution.max();
      const minVal = adjustedExpertDistribution.min();

      // Put high (but less than winning) values on anti-defeating moves
      for (
        let i = this._antiDefeatingMoves.nextSetBit(0);
        i >= 0;
        i = this._antiDefeatingMoves.nextSetBit(i + 1)
      ) {
        adjustedExpertDistribution.set(i, maxVal);
      }

      // Put large values on winning moves
      for (
        let i = this._winningMoves.nextSetBit(0);
        i >= 0;
        i = this._winningMoves.nextSetBit(i + 1)
      ) {
        adjustedExpertDistribution.set(i, maxVal * 2);
      }

      // Put low values on losing moves
      for (
        let i = this._losingMoves.nextSetBit(0);
        i >= 0;
        i = this._losingMoves.nextSetBit(i + 1)
      ) {
        adjustedExpertDistribution.set(i, minVal / 2);
      }

      // Re-normalise to probability distribution
      adjustedExpertDistribution.normalise();
    }

    return adjustedExpertDistribution;
  }

  /**
   * @return Value estimates computed by expert (MCTS)
   * @java ExItExperience.expertValueEstimates()
   */
  public expertValueEstimates(): FVector {
    return this._expertValueEstimates;
  }

  /**
   * @return Duration of full episode in which this experience was generated
   * @java ExItExperience.episodeDuration()
   */
  public episodeDuration(): number {
    return this._episodeDuration;
  }

  /**
   * @return Array of outcomes (one per player) of episode in which this experience was generated
   * @java ExItExperience.playerOutcomes()
   */
  public playerOutcomes(): number[] | null {
    return this._playerOutcomes;
  }

  /**
   * Sets the index in replay buffer from which we sampled this if using PER
   * @java ExItExperience.setBufferIdx(int)
   */
  public setBufferIdx(bufferIdx: number): void {
    this._bufferIdx = bufferIdx;
  }

  /**
   * Sets the episode duration
   * @java ExItExperience.setEpisodeDuration(int)
   */
  public setEpisodeDuration(episodeDuration: number): void {
    this._episodeDuration = episodeDuration;
  }

  /**
   * Sets the per-player outcomes for the episode in which this experience was generated
   * @java ExItExperience.setPlayerOutcomes(double[])
   */
  public setPlayerOutcomes(playerOutcomes: number[]): void {
    this._playerOutcomes = playerOutcomes;
  }

  /**
   * Sets our state-feature-vector (for state value functions)
   * @java ExItExperience.setStateFeatureVector(FVector)
   */
  public setStateFeatureVector(vector: FVector): void {
    this._stateFeatureVector = vector;
  }

  /**
   * Set which moves are winning moves
   * @java ExItExperience.setWinningMoves(BitSet)
   */
  public setWinningMoves(winningMoves: BitSet): void {
    this._winningMoves.clear();
    this._winningMoves.or(winningMoves);
  }

  /**
   * Set which moves are losing moves
   * @java ExItExperience.setLosingMoves(BitSet)
   */
  public setLosingMoves(losingMoves: BitSet): void {
    this._losingMoves.clear();
    this._losingMoves.or(losingMoves);
  }

  /**
   * Set which moves are anti-defeating moves
   * @java ExItExperience.setAntiDefeatingMoves(BitSet)
   */
  public setAntiDefeatingMoves(antiDefeatingMoves: BitSet): void {
    this._antiDefeatingMoves.clear();
    this._antiDefeatingMoves.or(antiDefeatingMoves);
  }

  /**
   * Sets the importance sampling weight assigned to this sample by CE Explore
   * @java ExItExperience.setWeightCEExplore(float)
   */
  public setWeightCEExplore(weightCEExplore: number): void {
    this._weightCEExplore = weightCEExplore;
  }

  /**
   * Sets the importance sampling weight assigned to this sample by Prioritized Experience Replay
   * @java ExItExperience.setWeightPER(float)
   */
  public setWeightPER(weightPER: number): void {
    this._weightPER = weightPER;
  }

  /**
   * @return State feature vector
   * @java ExItExperience.stateFeatureVector()
   */
  public stateFeatureVector(): FVector | null {
    return this._stateFeatureVector;
  }

  /**
   * @return Importance sampling weight for CE exploration
   * @java ExItExperience.weightCEExplore()
   */
  public weightCEExplore(): number {
    return this._weightCEExplore;
  }

  /**
   * @return Importance sampling weight assigned to this sample by Prioritized Experience Replay
   * @java ExItExperience.weightPER()
   */
  public weightPER(): number {
    return this._weightPER;
  }

  /**
   * @return Importance sampling weight assigned to this sample based on tree search visit count
   * @java ExItExperience.weightVisitCount()
   */
  public weightVisitCount(): number {
    return this._weightVisitCount;
  }

  /**
   * @java ExItExperience.gameState()
   */
  public override gameState(): State {
    return this._state.state() as unknown as State;
  }

  /**
   * @java ExItExperience.lastFromPos()
   */
  public override lastFromPos(): number {
    return FeatureUtils.fromPos(this._state.lastDecisionMove() as Move);
  }

  /**
   * @java ExItExperience.lastToPos()
   */
  public override lastToPos(): number {
    return FeatureUtils.toPos(this._state.lastDecisionMove() as Move);
  }

  /**
   * @java ExItExperience.winningMoves()
   */
  public override winningMoves(): BitSet {
    return this._winningMoves;
  }

  /**
   * @java ExItExperience.losingMoves()
   */
  public override losingMoves(): BitSet {
    return this._losingMoves;
  }

  /**
   * @java ExItExperience.antiDefeatingMoves()
   */
  public override antiDefeatingMoves(): BitSet {
    return this._antiDefeatingMoves;
  }

  //-------------------------------------------------------------------------

  /**
   * @java ExItExperience.generateFeatureVectors(BaseFeatureSet)
   */
  public override generateFeatureVectors(featureSet: BaseFeatureSet): FeatureVector[] {
    return (featureSet as unknown as {
      computeFeatureVectors(
        state: unknown,
        lastDecisionMove: unknown,
        moves: FastArrayList<Move>,
        includeAspatial: boolean,
      ): FeatureVector[];
    }).computeFeatureVectors(
      this._state.state(),
      this._state.lastDecisionMove(),
      this._moves,
      false,
    );
  }

  //-------------------------------------------------------------------------

}

//-------------------------------------------------------------------------

/**
 * Minimal mutable BitSet implementation for use in ExItExperience.
 * Implements the BitSet interface from FeatureSetExpander.ts.
 *
 * @java java.util.BitSet
 */
class JsBitSet implements BitSet {
  private bits: Set<number> = new Set();

  /** @java BitSet.nextSetBit(int) */
  public nextSetBit(from: number): number {
    if (this.bits.size === 0) return -1;
    // Find smallest bit >= from
    let min = Infinity;
    for (const b of this.bits) {
      if (b >= from && b < min) min = b;
    }
    return min === Infinity ? -1 : min;
  }

  /** @java BitSet.get(int) */
  public get(i: number): boolean {
    return this.bits.has(i);
  }

  /** @java BitSet.set(int) */
  public setBit(i: number): void {
    this.bits.add(i);
  }

  /** @java BitSet.clear() */
  public clear(): void {
    this.bits.clear();
  }

  /** @java BitSet.or(BitSet) */
  public or(other: BitSet): void {
    for (
      let i = other.nextSetBit(0);
      i >= 0;
      i = other.nextSetBit(i + 1)
    ) {
      this.bits.add(i);
    }
  }

  /** @java BitSet.isEmpty() */
  public isEmpty(): boolean {
    return this.bits.size === 0;
  }
}

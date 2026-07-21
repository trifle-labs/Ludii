// @java AI/src/training/ExperienceSample.java

/**
 * Abstract class for a sample of experience.
 *
 * @java training/ExperienceSample.java
 * @author Dennis Soemers
 */

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported types

/** @java features.FeatureVector */
export interface FeatureVector {
  aspatialFeatureValues(): { get(i: number): number; dim(): number };
  activeSpatialFeatureIndices(): {
    size(): number;
    getQuick(j: number): number;
    contains(i: number): boolean;
  };
}

/** @java features.feature_sets.BaseFeatureSet */
export interface BaseFeatureSet {
  computeFeatureVectors(
    context: unknown,
    moves: unknown,
    heuristic: boolean
  ): FeatureVector[];
}

/** @java main.collections.FVector */
export interface FVector {
  get(i: number): number;
  dim(): number;
  sampleProportionally(): number;
}

/** @java main.collections.FastArrayList */
export interface FastArrayList<T> {
  get(i: number): T;
  size(): number;
}

/** @java other.move.Move */
export interface Move {
  __move: true;
}

/** @java other.state.State */
export interface State {
  __state: true;
}

/** @java java.util.BitSet */
export interface BitSet {
  isEmpty(): boolean;
  nextSetBit(from: number): number;
}

// ---------------------------------------------------------------------------

/**
 * Abstract class for a sample of experience.
 *
 * @java training.ExperienceSample
 */
export abstract class ExperienceSample {

  //-------------------------------------------------------------------------

  /**
   * Should be implemented to (generate and) return feature vectors corresponding
   * to the moves that were legal in this sample of experience. Can use the given
   * feature set to generate them, but can also return already-cached ones.
   *
   * @param featureSet
   * @return Feature vectors corresponding to this sample of experience
   * @java ExperienceSample.generateFeatureVectors(BaseFeatureSet)
   */
  public abstract generateFeatureVectors(featureSet: BaseFeatureSet): FeatureVector[];

  /**
   * Should be implemented to return an expert distribution over actions.
   *
   * @return Expert distribution over actions
   * @java ExperienceSample.expertDistribution()
   */
  public abstract expertDistribution(): FVector;

  /**
   * @return Game state
   * @java ExperienceSample.gameState()
   */
  public abstract gameState(): State;

  /**
   * @return From-position, for features, from last decision move.
   * @java ExperienceSample.lastFromPos()
   */
  public abstract lastFromPos(): number;

  /**
   * @return To-position, for features, from last decision move.
   * @java ExperienceSample.lastToPos()
   */
  public abstract lastToPos(): number;

  /**
   * @return List of legal moves
   * @java ExperienceSample.moves()
   */
  public abstract moves(): FastArrayList<Move>;

  /**
   * @return BitSet of winning moves
   * @java ExperienceSample.winningMoves()
   */
  public abstract winningMoves(): BitSet;

  /**
   * @return BitSet of losing moves
   * @java ExperienceSample.losingMoves()
   */
  public abstract losingMoves(): BitSet;

  /**
   * @return BitSet of anti-defeating moves
   * @java ExperienceSample.antiDefeatingMoves()
   */
  public abstract antiDefeatingMoves(): BitSet;

  //-------------------------------------------------------------------------
}

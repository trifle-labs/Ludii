// @java Core/src/metadata/ai/heuristics/terms/HeuristicTerm.java

import type { HeuristicTransformation } from "../transformations/HeuristicTransformation.js";

/**
 * Abstract class for heuristic terms. Every heuristic term is expected to implement
 * a function that outputs a score for a given game state and player, and every term
 * has a weight that is used for computing linear combinations of multiple terms.
 *
 * @author Dennis Soemers and matthew.stephenson
 *
 * @remarks Runtime methods (computeValue, computeStateFeatureVector, paramsVector,
 * updateParams, init, isApplicable) use `unknown` for Game/Context/FVector since
 * those runtime subsystems are outside the metadata-only translation scope.
 */
export abstract class HeuristicTerm {
  // -------------------------------------------------------------------------

  /** The weight of this term in linear combinations */
  protected weight: number;

  /** Transformation to apply to heuristic score (before multiplying with weight!) */
  protected readonly transformation: HeuristicTransformation | null;

  // -------------------------------------------------------------------------

  /**
   * Constructor
   *
   * @param transformation An optional transformation to be applied to any raw heuristic
   * score outputs.
   * @param weight The weight for this term in a linear combination of multiple terms.
   * If not specified, a default weight of 1.0 is used.
   */
  constructor(transformation: HeuristicTransformation | null, weight: number | null) {
    this.weight = weight == null ? 1.0 : weight;
    this.transformation = transformation;
  }

  /**
   * Copy method (not copy constructor, so not visible to grammar)
   * @return Copy of the heuristic term
   */
  abstract copy(): HeuristicTerm;

  // -------------------------------------------------------------------------

  /** @return English description of this heuristic. */
  abstract description(): string;

  /**
   * @param context
   * @param playerIndex
   * @return toString of this Heuristic in an English language format.
   */
  abstract toEnglishString(context: unknown, playerIndex: number): string;

  // -------------------------------------------------------------------------

  /**
   * @param term
   * @return if this HeuristicTerm can be merged with the parameter term.
   */
  canBeMerged(term: HeuristicTerm): boolean {
    return this.constructor.name === term.constructor.name;
  }

  /**
   * Merges this HeuristicTerm with the parameter term.
   * @param term
   */
  merge(term: HeuristicTerm): void {
    this.setWeight(this.weight + term.weight);
  }

  /** Simplifies this heuristic, usually by combining weights. */
  simplify(): void {
    // do nothing
  }

  /** @return the maximum weight value for any aspect of this heuristic. */
  maxAbsWeight(): number {
    return Math.abs(this.weight);
  }

  // -------------------------------------------------------------------------

  /**
   * Computes heuristic value estimate for the given state
   * from the perspective of the given player. This should NOT
   * apply any transformations.
   *
   * @param context
   * @param player
   * @param absWeightThreshold We skip terms with an absolute weight below this value
   *   (negative for no skipping)
   * @return Heuristic value estimate
   */
  abstract computeValue(context: unknown, player: number, absWeightThreshold: number): number;

  /**
   * Allows for initialisation / precomputation of data for a given game.
   * Default implementation does nothing.
   *
   * @param game
   */
  init(_game: unknown): void {
    // Do nothing
  }

  // -------------------------------------------------------------------------

  /**
   * @param context
   * @param player
   * @return Heuristic's feature vector in given state, from perspective of given player
   */
  abstract computeStateFeatureVector(context: unknown, player: number): unknown;

  /**
   * @return Vector of parameters (weights including "internal" weights of nested heuristics).
   * Should return null if this term does not have any internal weights.
   */
  abstract paramsVector(): unknown | null;

  /**
   * Updates weights in heuristic based on given vector of params.
   *
   * @param game
   * @param newParams  FVector (opaque)
   * @param startIdx Index at which to start reading params
   * @return Index in vector at which the next heuristic term is allowed to start reading
   */
  updateParams(game: unknown, newParams: unknown, startIdx: number): number {
    // Minimal metadata-only implementation; runtime subclasses override.
    void game;
    void newParams;
    return startIdx + 1;
  }

  // -------------------------------------------------------------------------

  /** @return A transformation to be applied to output values (null for no transformation) */
  getTransformation(): HeuristicTransformation | null {
    return this.transformation;
  }

  /** @return Weight for this term in linear combination of multiple heuristic terms */
  getWeight(): number {
    return this.weight;
  }

  // -------------------------------------------------------------------------

  /**
   * @param game
   * @return True if heuristic of this type could be applicable to given game
   */
  abstract isApplicable(game: unknown): boolean;

  // -------------------------------------------------------------------------

  /**
   * @param threshold
   * @return A string representation of this heuristic term, with any components
   * for which the absolute weight does not exceed the given threshold removed.
   * Should return null if there are no components remaining after thresholding.
   */
  abstract toStringThresholded(threshold: number): string | null;

  // -------------------------------------------------------------------------

  /** @param weight */
  setWeight(weight: number): void {
    this.weight = weight;
  }

  /** Used for term reconstruction using a genetic code */
  gameAgnosticWeightsArray(): number[] | null {
    return null;
  }

  /** Used for term reconstruction using a genetic code */
  getPieceWeights(): unknown | null {
    return null;
  }

  // -------------------------------------------------------------------------
}

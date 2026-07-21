// @java AI/src/training/expert_iteration/ExpertPolicy.java

/**
 * Abstract class for policies that can serve as experts in Expert Iteration.
 *
 * @java training/expert_iteration/ExpertPolicy.java
 * @author Dennis Soemers
 */

import { AI } from "../../../../../ludemes/other/other/AI.js";

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported types

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

/** @java training.expert_iteration.ExItExperience */
export interface ExItExperience {
  __exItExperience: true;
}

// ---------------------------------------------------------------------------

/**
 * Abstract class for policies that can serve as experts in Expert Iteration.
 *
 * @java training.expert_iteration.ExpertPolicy
 */
export abstract class ExpertPolicy extends AI {

  //-------------------------------------------------------------------------

  /**
   * @return Should return a list of the moves considered at the
   *   "root" state during the last search executed by this expert.
   * @java ExpertPolicy.lastSearchRootMoves()
   */
  public abstract lastSearchRootMoves(): FastArrayList<Move>;

  /**
   * @param tau Temperature parameter that may or may not be used
   *   by some experts. For MCTS, tau = 1.0 means proportional to
   *   visit counts, whereas tau --> 0.0 means greedy with respect
   *   to visit counts.
   * @return Policy / distribution over actions as computed by expert
   * @java ExpertPolicy.computeExpertPolicy(double)
   */
  public abstract computeExpertPolicy(tau: number): FVector;

  /**
   * @return A list of samples of experience for Expert Iteration, based on
   *   the last search executed by this expert.
   * @java ExpertPolicy.generateExItExperiences()
   */
  public abstract generateExItExperiences(): ExItExperience[];

  //-------------------------------------------------------------------------
}

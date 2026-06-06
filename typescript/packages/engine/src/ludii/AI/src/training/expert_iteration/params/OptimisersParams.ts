// @java AI/src/training/expert_iteration/params/OptimisersParams.java

/**
 * Wrapper around params for optimisers in training runs.
 *
 * @java training/expert_iteration/params/OptimisersParams.java
 * @author Dennis Soemers
 */

/**
 * Wrapper around params for optimisers in training runs.
 *
 * @java training.expert_iteration.params.OptimisersParams
 */
export class OptimisersParams {

  //-------------------------------------------------------------------------

  /** Optimiser to use when optimising policy for Selection phase */
  public selectionOptimiserConfig: string = "";

  /** Optimiser to use when optimising policy for Playout phase */
  public playoutOptimiserConfig: string = "";

  /** Optimiser to use when optimising the Cross-Entropy Exploration policy */
  public ceExploreOptimiserConfig: string = "";

  /** Optimiser to use when optimising policy on TSPG objective (see CoG 2019 paper) */
  public tspgOptimiserConfig: string = "";

  /** Optimiser to use when optimising value function */
  public valueOptimiserConfig: string = "";

  //-------------------------------------------------------------------------
}

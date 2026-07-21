// @java AI/src/training/expert_iteration/params/ObjectiveParams.java

/**
 * Wrapper around params for objective function(s) in training runs.
 *
 * @java training.expert_iteration.params.ObjectiveParams
 * @author Dennis Soemers
 */
export class ObjectiveParams {

  //-------------------------------------------------------------------------

  /** If true, we'll train a policy on TSPG objective (see CoG 2019 paper) */
  public trainTSPG: boolean = false;

  /** If true, we'll use importance sampling weights based on episode durations for CE-loss */
  public importanceSamplingEpisodeDurations: boolean = false;

  /** If true, we use Weighted Importance Sampling instead of Ordinary Importance Sampling for any of the above */
  public weightedImportanceSampling: boolean = false;

  /** If true, we don't do any value function learning */
  public noValueLearning: boolean = false;

  /** If true, we handle move aliasing by putting the maximum mass among all aliased moves on each of them, for training selection policy. */
  public handleAliasing: boolean = false;

  /** If true, we handle move aliasing by putting the maximum mass among all aliased moves on each of them, for training playout policy. */
  public handleAliasingPlayouts: boolean = false;

  /** Lambda param for weight decay (~= 2c for L2 regularisation, in absence of momentum) */
  public weightDecayLambda: number = 0.0;

  //-------------------------------------------------------------------------

}

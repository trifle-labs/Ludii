// @java AI/src/training/expert_iteration/params/TrainingParams.java

/**
 * Wrapper around params for basic training setup/configuration.
 *
 * @java training.expert_iteration.params.TrainingParams
 * @author Dennis Soemers
 */
export class TrainingParams {

  //-------------------------------------------------------------------------

  /** Number of training games to run */
  public numTrainingGames: number = 0;

  /** Max size of minibatches in training. */
  public batchSize: number = 0;

  /** Max size of the experience buffer. */
  public experienceBufferSize: number = 0;

  /** After this many moves (decision points) in training games, we update weights. */
  public updateWeightsEvery: number = 0;

  /** If true, we'll use prioritized experience replay */
  public prioritizedExperienceReplay: boolean = false;

  /** If not null/empty, will try to find a good value function to start with from this directory */
  public initValueFuncDir: string = "";

  /** Number of epochs to run for policy gradients. */
  public numPolicyGradientEpochs: number = 0;

  /** Number of trials to run per epoch for policy gradients */
  public numTrialsPerPolicyGradientEpoch: number = 0;

  /** Discount factor gamma for policy gradients */
  public pgGamma: number = 0.0;

  /** Weight for entropy regularisation */
  public entropyRegWeight: number = 0.0;

  /** Number of threads to use for parallel trials for policy gradients */
  public numPolicyGradientThreads: number = 0;

  /** After running policy gradients, scale obtained weights by this value */
  public postPGWeightScalar: number = 0.0;

  //-------------------------------------------------------------------------

}

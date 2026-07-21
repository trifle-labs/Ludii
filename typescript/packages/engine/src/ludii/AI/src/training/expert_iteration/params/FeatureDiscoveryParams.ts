// @java AI/src/training/expert_iteration/params/FeatureDiscoveryParams.java

/**
 * Wrapper around params for feature discovery settings.
 *
 * @java training.expert_iteration.params.FeatureDiscoveryParams
 * @author Dennis Soemers
 */
export class FeatureDiscoveryParams {

  //-------------------------------------------------------------------------

  /** After this many training games, we add a new feature. */
  public addFeatureEvery: number = 0;

  /** If true, we'll not grow feature set (but still train weights) */
  public noGrowFeatureSet: boolean = false;

  /** At most this number of feature instances will be taken into account when combining features */
  public combiningFeatureInstanceThreshold: number = 0;

  /** Number of threads to use for parallel feature discovery */
  public numFeatureDiscoveryThreads: number = 0;

  /** Critical value used when computing confidence intervals for correlations */
  public criticalValueCorrConf: number = 0.0;

  /** If true, use a special-moves expander in addition to the normal one */
  public useSpecialMovesExpander: boolean = false;

  /** If true, use a special-moves expander in addition to the normal one, but split time with the normal one (so same number of total features) */
  public useSpecialMovesExpanderSplit: boolean = false;

  /** Type of feature set expander to use */
  public expanderType: string = "";

  //-------------------------------------------------------------------------

}

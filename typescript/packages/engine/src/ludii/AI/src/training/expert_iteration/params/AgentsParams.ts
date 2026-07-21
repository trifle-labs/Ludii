// @java AI/src/training/expert_iteration/params/AgentsParams.java

/**
 * Wrapper around params for agents setup/configuration in training runs.
 *
 * @java training/expert_iteration/params/AgentsParams.java
 * @author Dennis Soemers
 */

/**
 * Wrapper around params for agents setup/configuration in training runs.
 *
 * @java training.expert_iteration.params.AgentsParams
 */
export class AgentsParams {

  //-------------------------------------------------------------------------

  /** Type of AI to use as expert */
  public expertAI: string = "";

  /** Filepath for best agents data directory for this specific game (+ options) */
  public bestAgentsDataDir: string = "";

  /** Max allowed thinking time per move (in seconds) */
  public thinkingTime: number = 0;

  /** Max allowed number of MCTS iterations per move */
  public iterationLimit: number = 0;

  /** Search depth limit (for e.g. Alpha-Beta experts) */
  public depthLimit: number = 0;

  /** Maximum number of actions per playout which we'll bias using features (-1 for no limit) */
  public maxNumBiasedPlayoutActions: number = 0;

  /** If true, use tournament mode (similar to the one in Polygames) */
  public tournamentMode: boolean = false;

  /** Epsilon for epsilon-greedy features-based playouts */
  public playoutFeaturesEpsilon: number = 0;

  /** Number of threads to use for Tree Parallelisation in MCTS-based agents */
  public numAgentThreads: number = 0;

  //-------------------------------------------------------------------------
}

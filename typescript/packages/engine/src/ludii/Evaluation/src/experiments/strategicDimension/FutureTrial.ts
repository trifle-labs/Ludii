// @java Evaluation/src/experiments/strategicDimension/FutureTrial.java

/**
 * Future trial for concurrent SD trials.
 *
 * @java experiments/strategicDimension/FutureTrial.java
 * @author cambolbro
 */

/** Minimal escape-hatch for not-yet-ported Game */
type Game = unknown;

//-----------------------------------------------------------------------------

/**
 * Future trial for concurrent SD trials.
 *
 * @java experiments/strategicDimension/FutureTrial.java
 */
export interface FutureTrial {

  /**
   * @param game    The single game object, shared across threads.
   * @param trialId The index of this trial within its epoch.
   * @param lower   Lower iteration count of this epoch for inferior agent.
   * @param upper   Upper iteration count of this epoch for superior agent.
   * @return Result of trial relative to superior agent (0=loss, 0.5=draw, 1=win).
   * @java FutureTrial.runTrial(Game, int, int, int)
   */
  runTrial(
    game: Game,
    trialId: number,
    lower: number,
    upper: number,
  ): Promise<number>;
}

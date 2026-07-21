// @java Mining/src/agentPrediction/internal/models/BaseModel.java

/**
 * Base interface for agent prediction models.
 *
 * @java agentPrediction/internal/models/BaseModel.java
 */

// Escape-hatch types for not-yet-ported dependencies

/** @java manager.Manager */
type Manager = unknown;

/**
 * Interface for agent prediction models.
 *
 * @java agentPrediction.internal.models.BaseModel
 */
export interface BaseModel {

  /** The name of the model used, must match up with the filepath to the stored model.
   * @java BaseModel.modelName()
   */
  modelName(): string;

  /** Returns the predicted win-rate for each agent in agentStrings, based on the game concepts.
   * @java BaseModel.predictAI(Manager, List<String>, TIntArrayList, String[])
   */
  predictAI(
    manager: Manager,
    flags: string[],
    flagsValues: number[],
    agentStrings: string[],
  ): number[];
}

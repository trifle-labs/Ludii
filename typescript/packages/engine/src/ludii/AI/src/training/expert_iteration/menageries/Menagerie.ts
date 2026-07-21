// @java AI/src/training/expert_iteration/menageries/Menagerie.java

/**
 * Interface for "menageries": objects that can tell us which agents to use
 * in self-play games of a self-play training process.
 *
 * @java training/expert_iteration/menageries/Menagerie.java
 * @author Dennis Soemers
 */

import { ExpertPolicy } from "../ExpertPolicy.js";
import { AgentsParams } from "../params/AgentsParams.js";
import type { Game, Features, Heuristics } from "./AgentCheckpoint.js";

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported types

/** @java other.context.Context */
export interface Context {
  __context: true;
}

// ---------------------------------------------------------------------------

/**
 * Data describing a collection of agents that has been drawn. Specific
 * implementations of Menageries may use subclasses of this to include
 * additional data that they might need.
 *
 * @java training.expert_iteration.menageries.Menagerie.DrawnAgentsData
 */
export class DrawnAgentsData {

  /** List of experts */
  protected readonly agents: (ExpertPolicy | null)[];

  /**
   * Constructor
   * @param agents
   * @java DrawnAgentsData(List<ExpertPolicy>)
   */
  public constructor(agents: (ExpertPolicy | null)[]) {
    this.agents = agents;
  }

  /**
   * @return List of expert agents
   * @java DrawnAgentsData.getAgents()
   */
  public getAgents(): (ExpertPolicy | null)[] {
    return this.agents;
  }
}

// ---------------------------------------------------------------------------

/**
 * Interface for "menageries": objects that can tell us which agents to use
 * in self-play games of a self-play training process.
 *
 * @java training.expert_iteration.menageries.Menagerie
 */
export interface Menagerie {

  //-------------------------------------------------------------------------

  /**
   * @param game
   * @param agentsParams
   * @return List of agents to use in a single self-play game
   * @java Menagerie.drawAgents(Game, AgentsParams)
   */
  drawAgents(game: Game, agentsParams: AgentsParams): DrawnAgentsData;

  //-------------------------------------------------------------------------

  /**
   * Initialise our population of checkpoints (+ dev)
   *
   * @param game
   * @param agentsParams
   * @param features
   * @param heuristics
   * @java Menagerie.initialisePopulation(Game, AgentsParams, Features, Heuristics)
   */
  initialisePopulation(
    game: Game,
    agentsParams: AgentsParams,
    features: Features,
    heuristics: Heuristics
  ): void;

  //-------------------------------------------------------------------------

  /**
   * Update the dev checkpoint's features
   * @param features
   * @java Menagerie.updateDevFeatures(Features)
   */
  updateDevFeatures(features: Features): void;

  /**
   * Update the dev checkpoint's heuristics
   * @param heuristics
   * @java Menagerie.updateDevHeuristics(Heuristics)
   */
  updateDevHeuristics(heuristics: Heuristics): void;

  /**
   * Update the menagerie based on an outcome of a self-play trial
   * @param context
   * @param drawnAgentsData
   * @java Menagerie.updateOutcome(Context, DrawnAgentsData)
   */
  updateOutcome(context: Context, drawnAgentsData: DrawnAgentsData): void;

  //-------------------------------------------------------------------------

  /**
   * @return String describing the menagerie's data, for log (or null if nothing to log)
   * @java Menagerie.generateLog()
   */
  generateLog(): string | null;

  //-------------------------------------------------------------------------
}

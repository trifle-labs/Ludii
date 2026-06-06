// @java AI/src/training/expert_iteration/menageries/NaiveSelfPlay.java

/**
 * Naive self-play menagerie: always uses the latest version of the trained agent,
 * for all player IDs.
 *
 * @java training/expert_iteration/menageries/NaiveSelfPlay.java
 * @author Dennis Soemers
 */

import { AgentCheckpoint } from "./AgentCheckpoint.js";
import { DrawnAgentsData } from "./Menagerie.js";
import type { Menagerie, Context } from "./Menagerie.js";
import { AgentsParams } from "../params/AgentsParams.js";
import type { Game, Features, Heuristics } from "./AgentCheckpoint.js";
import type { ExpertPolicy } from "../ExpertPolicy.js";

/**
 * Naive self-play menagerie: always uses the latest version of the trained agent,
 * for all player IDs.
 *
 * @java training.expert_iteration.menageries.NaiveSelfPlay
 */
export class NaiveSelfPlay implements Menagerie {

  //-------------------------------------------------------------------------

  /** Our dev checkpoint (the only one we actually use) */
  private dev!: AgentCheckpoint;

  //-------------------------------------------------------------------------

  /** @java NaiveSelfPlay.drawAgents(Game, AgentsParams) */
  public drawAgents(game: Game, agentsParams: AgentsParams): DrawnAgentsData {
    // Java: agents list has a null slot at index 0 (player 0 unused), then one agent per player
    const agents: (ExpertPolicy | null)[] = [null];
    for (let p = 1; p <= game.players().count(); ++p) {
      agents.push(this.dev.generateAgent(game, agentsParams));
    }
    return new DrawnAgentsData(agents);
  }

  //-------------------------------------------------------------------------

  /** @java NaiveSelfPlay.initialisePopulation(Game, AgentsParams, Features, Heuristics) */
  public initialisePopulation(
    game: Game,
    agentsParams: AgentsParams,
    features: Features,
    heuristics: Heuristics
  ): void {
    void game;
    this.dev = new AgentCheckpoint(agentsParams.expertAI, "Dev", features, heuristics);
  }

  /** @java NaiveSelfPlay.updateDevFeatures(Features) */
  public updateDevFeatures(features: Features): void {
    this.dev = new AgentCheckpoint(
      this.dev.agentName, "Dev", features, this.dev["heuristicsMetadata"]
    );
  }

  /** @java NaiveSelfPlay.updateDevHeuristics(Heuristics) */
  public updateDevHeuristics(heuristics: Heuristics): void {
    this.dev = new AgentCheckpoint(
      this.dev.agentName, "Dev", this.dev["featuresMetadata"], heuristics
    );
  }

  /** @java NaiveSelfPlay.updateOutcome(Context, DrawnAgentsData) */
  public updateOutcome(_context: Context, _drawnAgentsData: DrawnAgentsData): void {
    // Nothing to do here
  }

  /** @java NaiveSelfPlay.generateLog() */
  public generateLog(): string | null {
    return null;
  }

  //-------------------------------------------------------------------------
}

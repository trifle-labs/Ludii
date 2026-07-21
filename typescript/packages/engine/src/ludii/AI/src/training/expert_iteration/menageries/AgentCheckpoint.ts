// @java AI/src/training/expert_iteration/menageries/AgentCheckpoint.java

/**
 * A checkpoint containing all the data required to reproduce a version of an
 * agent at some point in a training process.
 *
 * @java training/expert_iteration/menageries/AgentCheckpoint.java
 * @author Dennis Soemers
 */

import { ExpertPolicy } from "../ExpertPolicy.js";
import { AgentsParams } from "../params/AgentsParams.js";

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported types

/** @java game.Game */
export interface Game {
  players(): { count(): number };
}

/** @java metadata.ai.features.Features */
export interface Features {
  __features: true;
}

/** @java metadata.ai.heuristics.Heuristics */
export interface Heuristics {
  __heuristics: true;
}

// ---------------------------------------------------------------------------

/**
 * A checkpoint containing all the data required to reproduce a version of an
 * agent at some point in a training process.
 *
 * @java training.expert_iteration.menageries.AgentCheckpoint
 */
export class AgentCheckpoint {

  //-------------------------------------------------------------------------

  /** Type of agent */
  public readonly agentName: string;

  /** Descriptor of this agent in population */
  protected readonly checkpointName_: string;

  /** Features metadata (can be null if this checkpoint doesn't use features) */
  protected readonly featuresMetadata: Features | null;

  /** Heuristics metadata (can be null if this checkpoint doesn't use heuristics) */
  protected readonly heuristicsMetadata: Heuristics | null;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param agentName
   * @param checkpointName
   * @param featuresMetadata
   * @param heuristicsMetadata
   * @java AgentCheckpoint(String, String, Features, Heuristics)
   */
  public constructor(
    agentName: string,
    checkpointName: string,
    featuresMetadata: Features | null,
    heuristicsMetadata: Heuristics | null
  ) {
    this.agentName = agentName;
    this.checkpointName_ = checkpointName;
    this.featuresMetadata = featuresMetadata;
    this.heuristicsMetadata = heuristicsMetadata;
  }

  //-------------------------------------------------------------------------

  /**
   * @param game
   * @param agentsParams
   * @return An agent generated based on this checkpoint
   * @java AgentCheckpoint.generateAgent(Game, AgentsParams)
   */
  public generateAgent(game: Game, agentsParams: AgentsParams): ExpertPolicy | null {
    // All agent-creation logic in Java depends on many not-yet-ported types
    // (AIFactory, MCTS, AlphaBetaSearch, etc.).  We use escape hatches here.
    const AIFactory = {} as unknown as {
      createAI(name: string): ExpertPolicy | null;
      fromMetadata(game: Game): ExpertPolicy | null;
    };

    const MCTS = {} as unknown as {
      createBiasedMCTS(features: Features | null, epsilon: number): ExpertPolicy;
      createUCT(): ExpertPolicy;
      NULL_UNDO_DATA: boolean;
    };

    const AlphaBetaSearch = {} as unknown as {
      new(path?: string): ExpertPolicy;
    };

    // Preserve root node factory helper (no-op stub)
    const preserveRoot = (ai: ExpertPolicy | null) => {
      if (ai !== null && ai !== undefined) {
        const mcts = ai as unknown as { setPreserveRootNode?: (b: boolean) => void };
        if (typeof mcts.setPreserveRootNode === "function")
          mcts.setPreserveRootNode(true);
      }
      return ai;
    };

    let ai: ExpertPolicy | null = null;

    if (this.agentName === "BEST_AGENT") {
      // Requires FileHandling + compiler.Compiler, not yet ported — return null stub
      console.error("AgentCheckpoint: BEST_AGENT requires FileHandling/Compiler, not yet ported");
      return null;
    } else if (this.agentName === "FROM_METADATA") {
      ai = AIFactory.fromMetadata(game);
      if (ai === null) {
        console.error("AI from metadata is null!");
        return null;
      }
    } else if (this.agentName === "Biased MCTS") {
      ai = MCTS.createBiasedMCTS(this.featuresMetadata, agentsParams.playoutFeaturesEpsilon);
      (ai as unknown as { setFriendlyName(n: string): void }).setFriendlyName?.("Biased MCTS");
    } else if (this.agentName === "PVTS") {
      // Requires NoisyAG0Selection, RandomPlayout, AlphaGoBackprop, RobustChild — not yet ported
      console.error("AgentCheckpoint: PVTS construction requires not-yet-ported MCTS components");
      return null;
    } else if (this.agentName === "UCT") {
      ai = MCTS.createUCT();
    } else if (this.agentName === "MC-GRAVE") {
      ai = AIFactory.createAI("MC-GRAVE");
    } else if (this.agentName === "MC-BRAVE") {
      ai = AIFactory.createAI("MC-BRAVE");
    } else {
      console.error("Cannot recognise expert AI: " + agentsParams.expertAI);
      return null;
    }

    return preserveRoot(ai);
  }

  //-------------------------------------------------------------------------

  /**
   * @return Descriptor of this agent in the population
   * @java AgentCheckpoint.checkpointName()
   */
  public checkpointName(): string {
    return this.checkpointName_;
  }

  //-------------------------------------------------------------------------
}

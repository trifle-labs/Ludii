// @java Mining/src/agentPrediction/internal/AgentPredictionInternal.java

/**
 * Predicts the best AI using an internal prediction model based on game concepts.
 *
 * @java agentPrediction/internal/AgentPredictionInternal.java
 */

import { Manager } from "../../../../Manager/src/manager/Manager.js";
import type { BaseModel } from "./models/BaseModel.js";

// Escape-hatch type for Concept (not-yet-ported as a full enum in src/ludii/)

/** @java other.concept.Concept — accessed via globalThis escape hatch */
interface ConceptLike {
  name(): string;
  id(): number;
}

//-----------------------------------------------------------------------------

export class AgentPredictionInternal {

  //-------------------------------------------------------------------------

  /**
   * Predicts the best AI, from a given prediction model.
   *
   * @java AgentPredictionInternal.predictAI(Manager, BaseModel)
   */
  public static predictAI(manager: Manager, predictionModel: BaseModel): void {
    manager.getPlayerInterface().selectAnalysisTab();

    const agentStrings: string[] = ["AlphaBeta", "MC-GRAVE", "Random", "UCT"];

    // Record all the concept Names and Values
    const flags: string[] = [];
    const flagsValues: number[] = [];

    // Java: for (final Concept concept : Concept.values())
    const Concept = (globalThis as unknown as { Concept?: { values(): ConceptLike[] } }).Concept;
    if (Concept !== undefined) {
      for (const concept of Concept.values()) {
        flags.push(concept.name());
        flagsValues.push(concept.id());
      }
    }

    // Calculate the predicted score for each agent.
    const agentPredictions: number[] = predictionModel.predictAI(manager, flags, flagsValues, agentStrings);

    // Give best agent prediction.
    let bestAgentScore = -999999999;
    let bestAgentName = "None";
    for (let agentIndex = 0; agentIndex < agentStrings.length; agentIndex++) {
      const predScore: number = agentPredictions[agentIndex] ?? 0;
      const agentName: string = agentStrings[agentIndex] ?? "";
      if (predScore > bestAgentScore) {
        bestAgentScore = predScore;
        bestAgentName = agentName;
      }
      manager.getPlayerInterface().addTextToAnalysisPanel(
        "Predicted win-rate for " + agentName + ": " + predScore + "\n"
      );
    }

    manager.getPlayerInterface().addTextToAnalysisPanel("Best predicted agent is " + bestAgentName + "\n");
    manager.getPlayerInterface().addTextToAnalysisPanel("//-------------------------------------------------------------------------\n");
  }

  //-------------------------------------------------------------------------
}

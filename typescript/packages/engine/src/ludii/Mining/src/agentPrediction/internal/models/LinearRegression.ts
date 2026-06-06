// @java Mining/src/agentPrediction/internal/models/LinearRegression.java

/**
 * Linear regression model for agent prediction.
 *
 * @java agentPrediction/internal/models/LinearRegression.java
 */

import type { BaseModel } from "./BaseModel.js";

// Escape-hatch types for not-yet-ported dependencies

/** @java manager.Manager */
interface ManagerLike {
  ref(): RefLike;
}

interface RefLike {
  context(): ContextLike;
}

interface ContextLike {
  game(): GameLike;
}

interface GameLike {
  booleanConcepts(): { get(id: number): boolean };
}

/**
 * Linear regression model for predicting best agent win-rates using CSV model files.
 *
 * @java agentPrediction.internal.models.LinearRegression
 */
export class LinearRegression implements BaseModel {

  //-------------------------------------------------------------------------

  /** @java LinearRegression.modelName() */
  public modelName(): string {
    return "LinearRegression";
  }

  //-------------------------------------------------------------------------

  /**
   * Predicts win-rate for each agent using a pre-trained linear regression model
   * loaded from CSV resource files.
   *
   * @java LinearRegression.predictAI(Manager, List<String>, TIntArrayList, String[])
   */
  public predictAI(
    manager: unknown,
    flags: string[],
    flagsValues: number[],
    agentStrings: string[],
  ): number[] {
    const managerLike = manager as ManagerLike;
    const agentPredictions: number[] = [0.0, 0.0, 0.0, 0.0];

    for (let agentIndex = 0; agentIndex < agentStrings.length; agentIndex++) {
      let predictedScore = 0;

      // Open CSV, and record all the values.
      const entries: Map<string, number> = new Map<string, number>();

      // Load the csv model file.
      const filePath = "/predictionModels/" + this.modelName() + "/" + agentStrings[agentIndex] + ".csv";
      console.log(filePath);

      // Java: loads from class resources (InputStream) — in TS runtime we cannot load resource files.
      // This is a no-op stub; real implementation would need Node.js fs or fetch.
      const lines: string[] | null = this._loadResourceLines(filePath);

      if (lines !== null) {
        for (const line of lines) {
          const lineSplit: string[] = line.split(",");
          if (lineSplit.length > 1) {
            entries.set(lineSplit[1] ?? "", Number(lineSplit[0]));
          } else {
            predictedScore = Number(lineSplit[0]);
          }
        }

        // Calculate the score for this agent.
        for (const [key, value] of entries) {
          for (let i = 0; i < flags.length; i++) {
            if (flags[i] === key) {
              const flagIndex: number = flagsValues[i] ?? 0;
              const flagValue: number = managerLike.ref().context().game().booleanConcepts().get(flagIndex) ? 1 : 0;
              predictedScore += value * flagValue;
              break;
            }
          }
        }
      } else {
        console.log("Failed to load agent prediction CSV for " + this.modelName() + ", " + agentStrings[agentIndex]);
      }

      agentPredictions[agentIndex] = predictedScore;
    }

    return agentPredictions;
  }

  //-------------------------------------------------------------------------

  /**
   * Load lines from a resource file (TS stub — Java used InputStream.getResourceAsStream).
   * Returns null if file cannot be loaded.
   *
   * @java LinearRegression.class.getResourceAsStream(filePath) — TS escape hatch
   */
  private _loadResourceLines(_filePath: string): string[] | null {
    // In a TS/browser or Node.js runtime, resource loading must be implemented
    // separately (e.g., via fetch or fs.readFileSync). Return null as a no-op stub.
    return null;
  }

  //-------------------------------------------------------------------------
}

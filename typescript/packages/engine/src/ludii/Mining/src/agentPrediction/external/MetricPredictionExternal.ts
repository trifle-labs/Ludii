// @java Mining/src/agentPrediction/external/MetricPredictionExternal.java

/**
 * Predict the values for each metric using external Python models.
 *
 * @java agentPrediction/external/MetricPredictionExternal.java
 */

import { Evaluation } from "../../../../Evaluation/src/metrics/Evaluation.js";
import { AgentPredictionExternal } from "./AgentPredictionExternal.js";
import { ComputePlayoutConcepts } from "../../../../Mining/src/utils/concepts/ComputePlayoutConcepts.js";

// Escape-hatch types for not-yet-ported dependencies

/** @java game.Game */
type GameLike = unknown;

//-----------------------------------------------------------------------------

export class MetricPredictionExternal {

  /**
   * Predict the values for each metric using external Python models.
   *
   * @java MetricPredictionExternal.predictMetrics(Game, String, boolean)
   */
  public static predictMetrics(
    game: GameLike,
    modelFilePath: string,
    compilationOnly: boolean,
  ): Map<string, number> {
    const startTime: number = Date.now();

    if (!compilationOnly) {
      ComputePlayoutConcepts.updateGame(game as never, new Evaluation() as never, 10, -1, 1, "Random", true);
    } else {
      // Still need to run this with zero trials to get compilation concepts
      ComputePlayoutConcepts.updateGame(game as never, new Evaluation() as never, 0, -1, 1, "Random", true);
    }

    const ms: number = Date.now() - startTime;
    console.log("Playouts computation done in " + ms + " ms.");

    // Java: reads file names from folder to get metric names.
    // In TS/browser this is not available directly; we use an escape hatch via globalThis.
    const allMetricNames: string[] = MetricPredictionExternal._listModelFiles(modelFilePath);

    return AgentPredictionExternal.predictBestAgentName(
      game,
      allMetricNames,
      modelFilePath,
      false,
      compilationOnly,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * List file names inside a model folder.
   * Java used: new File(path).listFiles() — TS escape hatch using globalThis or Node.js fs.
   *
   * @java new File("../../LudiiPrivate/DataMiningScripts/Sklearn/res/trainedModels/" + modelFilePath).listFiles()
   */
  private static _listModelFiles(modelFilePath: string): string[] {
    const basePath = "../../LudiiPrivate/DataMiningScripts/Sklearn/res/trainedModels/" + modelFilePath;
    try {
      const req = (globalThis as unknown as { require?: (m: string) => { readdirSync: (p: string) => string[] } }).require;
      if (req !== undefined) {
        const fs = req("fs");
        return fs.readdirSync(basePath);
      }
    } catch (_e) {
      // ignore — not available in browser or if directory does not exist
    }
    console.log("_listModelFiles: filesystem access not available in this runtime. Path: " + basePath);
    return [];
  }

  //-------------------------------------------------------------------------
}

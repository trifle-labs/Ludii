// @java Mining/src/agentPrediction/external/AgentPredictionExternal.java

/**
 * Predict the best agent/heuristic using external Python models.
 *
 * Models are produced by the "generate_agent_heuristic_prediction_models()" function in the Sklearn "Main.py" file.
 *
 * @java agentPrediction/external/AgentPredictionExternal.java
 * @author Matthew.Stephenson
 */

import { Evaluation } from "../../../../Evaluation/src/metrics/Evaluation.js";
import { AIRegistry } from "../../../../AI/src/utils/AIRegistry.js";
import { AIUtils } from "../../../../AI/src/utils/AIUtils.js";
import { ComputePlayoutConcepts } from "../../../../Mining/src/utils/concepts/ComputePlayoutConcepts.js";

// Escape-hatch types for not-yet-ported dependencies

/** @java game.Game */
interface GameLike {
  name(): string;
  booleanConcepts(): { get(id: number): boolean };
  nonBooleanConcepts(): Map<number, string>;
}

/** @java other.concept.Concept */
interface ConceptLike {
  name(): string;
  id(): number;
  computationType(): ConceptComputationTypeLike;
  dataType(): ConceptDataTypeLike;
}

interface ConceptComputationTypeLike {
  equals(other: ConceptComputationTypeLike): boolean;
}

interface ConceptDataTypeLike {
  equals(other: ConceptDataTypeLike): boolean;
}

/** @java other.concept.ConceptComputationType.Compilation — escape hatch constant */
const ConceptComputationTypeCompilation = Symbol("Compilation");

/** @java other.concept.ConceptDataType.BooleanData — escape hatch constant */
const ConceptDataTypeBooleanData = Symbol("BooleanData");

/** Concept static accessor via globalThis — not-yet-ported as full enum */
interface ConceptStatic {
  values(): ConceptLike[];
  portfolioConcepts(): ConceptLike[];
}

function getConcept(): ConceptStatic | null {
  return (globalThis as unknown as { Concept?: ConceptStatic }).Concept ?? null;
}

//-----------------------------------------------------------------------------

/**
 * Predict the best agent/heuristic using external Python models.
 *
 * @java agentPrediction.external.AgentPredictionExternal
 */
export class AgentPredictionExternal {

  /**
   * Predict the best agent/heuristic using external Python models.
   *
   * @java AgentPredictionExternal.predictBestAgent(Game, String, boolean, boolean, boolean)
   */
  public static predictBestAgent(
    game: unknown,
    modelFilePath: string,
    classificationModel: boolean,
    heuristics: boolean,
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

    let allModelNames: string[] = AIRegistry.generateValidAgentNames(game);
    if (heuristics) {
      allModelNames = Array.from(AIUtils.allHeuristicNames());
    }

    return AgentPredictionExternal.predictBestAgentName(game, allModelNames, modelFilePath, classificationModel, compilationOnly);
  }

  //-------------------------------------------------------------------------

  /**
   * @return Name of the best predicted agent from our pre-trained set of models.
   *
   * @java AgentPredictionExternal.predictBestAgentName(Game, List<String>, String, boolean, boolean)
   */
  public static predictBestAgentName(
    game: unknown,
    allValidLabelNames: string[],
    modelFilePath: string,
    classificationModel: boolean,
    compilationOnly: boolean,
  ): Map<string, number> {
    const agentPredictions: Map<string, number> = new Map();

    // Java: spawns a Python subprocess via Runtime.getRuntime().exec(...)
    // In TS, subprocess execution is environment-specific (Node.js child_process or not available).
    // This method provides the TS-equivalent stub that logs intention and returns empty map.
    // A real implementation would use Node.js `child_process.execSync` or `spawnSync`.

    const conceptNameStr: string = "RulesetName," + AgentPredictionExternal.conceptNameString(compilationOnly);
    const conceptValueStr: string = "UNUSED," + AgentPredictionExternal.conceptValueString(game as GameLike, compilationOnly);

    if (classificationModel) {
      // Classification prediction, just the agent name or probability for each.
      const arg1: string = modelFilePath;
      const arg2: string = "Classification";
      const arg3: string = conceptNameStr;
      const arg4: string = conceptValueStr;

      const output: string | null = AgentPredictionExternal._execPython(
        "python3 ../../LudiiPrivate/DataMiningScripts/Sklearn/External/GetBestPredictedAgent.py " +
          arg1 + " " + arg2 + " " + arg3 + " " + arg4
      );

      if (output !== null) {
        for (const sInput of output.split("\n")) {
          console.log(sInput);
          if (sInput.includes("PREDICTION")) {
            try {
              const eqPart: string = sInput.split("=")[1] ?? "";
              const classNamesAndProbas: string[] = eqPart.split("_:_");
              const classNames: string[] = (classNamesAndProbas[0] ?? "").split("_;_");
              const valueStrings: string[] = (classNamesAndProbas[1] ?? "").split("_;_");
              const values: number[] = valueStrings.map((v) => Number(v));
              if (classNames.length !== values.length) {
                console.log("ERROR! Class Names and Values should be the same length.");
              }
              for (let i = 0; i < classNames.length; i++) {
                agentPredictions.set(classNames[i] ?? "", values[i] ?? 0);
              }
              return agentPredictions;
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
    } else {
      // Regression prediction, get the predicted value for each valid agent.
      for (const agentName of allValidLabelNames) {
        const arg1: string = modelFilePath;
        const arg2: string = agentName.replace(/ /g, "_");
        const arg3: string = conceptNameStr;
        const arg4: string = conceptValueStr;

        const output: string | null = AgentPredictionExternal._execPython(
          "python3 ../../LudiiPrivate/DataMiningScripts/Sklearn/External/GetBestPredictedAgent.py " +
            arg1 + " " + arg2 + " " + arg3 + " " + arg4
        );

        console.log("Predicting for " + agentName);

        if (output !== null) {
          for (const sInput of output.split("\n")) {
            console.log(sInput);
            if (sInput.includes("PREDICTION")) {
              const predictedValue: number = Number(sInput.split("=")[1] ?? "0");
              agentPredictions.set(agentName, predictedValue);
            }
          }
        }
      }

      return agentPredictions;
    }

    return agentPredictions;
  }

  //-------------------------------------------------------------------------

  /**
   * Predict portfolio parameters using external Python models.
   *
   * @java AgentPredictionExternal.predictPortfolioParameters(Game)
   */
  public static predictPortfolioParameters(game: unknown): Map<string, Map<string, number>> {
    const portfolioParameterPredictions: Map<string, Map<string, number>> = new Map();
    const portfolioParameters: string[] = ["Heuristics", "Agents", "Selections", "Explorations", "Playouts", "Backpropagations"];

    // Still need to run this with zero trials to get compilation concepts
    ComputePlayoutConcepts.updateGame(game as never, new Evaluation() as never, 0, -1, 1, "Random", true);

    for (const param of portfolioParameters) {
      const paramPredictions: Map<string, number> = new Map();

      const conceptNameStr: string = "RulesetName," + AgentPredictionExternal.conceptNameString(true);
      const conceptValueStr: string = "UNUSED," + AgentPredictionExternal.conceptValueString(game as GameLike, true);

      const arg1: string = "RandomForestClassifier-Classification-" + param + "-Portfolio";
      const arg2: string = "Classification";
      const arg3: string = conceptNameStr;
      const arg4: string = conceptValueStr;

      const output: string | null = AgentPredictionExternal._execPython(
        "python3 ../../LudiiPrivate/DataMiningScripts/Sklearn/External/GetBestPredictedAgent.py " +
          arg1 + " " + arg2 + " " + arg3 + " " + arg4
      );

      if (output !== null) {
        for (const sInput of output.split("\n")) {
          console.log(sInput);
          if (sInput.includes("PREDICTION")) {
            try {
              const eqPart2: string = sInput.split("=")[1] ?? "";
              const classNamesAndProbas2: string[] = eqPart2.split("_:_");
              const classNames2: string[] = (classNamesAndProbas2[0] ?? "").split("_;_");
              const valueStrings2: string[] = (classNamesAndProbas2[1] ?? "").split("_;_");
              const values2: number[] = valueStrings2.map((v) => Number(v));
              if (classNames2.length !== values2.length) {
                console.log("ERROR! Class Names and Values should be the same length.");
              }
              for (let i = 0; i < classNames2.length; i++) {
                paramPredictions.set(classNames2[i] ?? "", values2[i] ?? 0);
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
      }

      portfolioParameterPredictions.set(param, paramPredictions);
    }

    return portfolioParameterPredictions;
  }

  //-------------------------------------------------------------------------

  /**
   * @return The concepts as a string with comma between them.
   *
   * @java AgentPredictionExternal.conceptNameString(boolean)
   */
  public static conceptNameString(compilationOnly: boolean): string {
    const Concept = getConcept();
    if (Concept === null) return "";

    const concepts: ConceptLike[] = compilationOnly ? Concept.values() : Concept.portfolioConcepts();
    const parts: string[] = [];
    for (const concept of concepts) {
      if (!compilationOnly || AgentPredictionExternal._isCompilationType(concept)) {
        parts.push(concept.name());
      }
    }
    return parts.join(",");
  }

  //-------------------------------------------------------------------------

  /**
   * @param game The game compiled.
   * @return The concepts as boolean values with comma between them.
   *
   * @java AgentPredictionExternal.conceptValueString(Game, boolean)
   */
  public static conceptValueString(game: GameLike, compilationOnly: boolean): string {
    const Concept = getConcept();
    if (Concept === null) return "";

    const concepts: ConceptLike[] = compilationOnly ? Concept.values() : Concept.portfolioConcepts();
    const parts: string[] = [];
    for (const concept of concepts) {
      if (!compilationOnly || AgentPredictionExternal._isCompilationType(concept)) {
        if (AgentPredictionExternal._isBooleanDataType(concept)) {
          parts.push(game.booleanConcepts().get(concept.id()) ? "1" : "0");
        } else {
          parts.push(game.nonBooleanConcepts().get(concept.id()) ?? "");
        }
      }
    }
    return parts.join(",");
  }

  //-------------------------------------------------------------------------

  /**
   * @java AgentPredictionExternal.getModelPath(String, boolean, boolean, boolean)
   */
  public static getModelPath(
    modelName: string,
    useClassifier: boolean,
    useHeuristics: boolean,
    useCompilationOnly: boolean,
  ): string {
    let modelFilePath: string = modelName;
    if (useClassifier) {
      modelFilePath += "-Classification";
    } else {
      modelFilePath += "-Regression";
    }
    if (useHeuristics) {
      modelFilePath += "-Heuristics";
    } else {
      modelFilePath += "-Agents";
    }
    if (useCompilationOnly) {
      modelFilePath += "-True";
    } else {
      modelFilePath += "-False";
    }
    return modelFilePath;
  }

  //-------------------------------------------------------------------------

  /**
   * Execute a Python process and return its stdout as a string, or null on error.
   * Java used Runtime.getRuntime().exec() — TS stub that delegates to environment.
   *
   * @java Runtime.getRuntime().exec(String) — TS escape hatch
   */
  private static _execPython(command: string): string | null {
    // In a Node.js environment this could use child_process.execSync.
    // In a browser environment this is unavailable. Return null as a no-op stub.
    try {
      const cp = (globalThis as unknown as { require?: (m: string) => { execSync: (cmd: string) => Buffer } }).require;
      if (cp !== undefined) {
        const { execSync } = cp("child_process");
        return execSync(command).toString("utf-8");
      }
    } catch (_e) {
      // ignore
    }
    console.log("_execPython: subprocess execution not available in this runtime. Command: " + command);
    return null;
  }

  //-------------------------------------------------------------------------

  /**
   * Check if a concept has Compilation computation type.
   * @java concept.computationType().equals(ConceptComputationType.Compilation) — escape hatch
   */
  private static _isCompilationType(concept: ConceptLike): boolean {
    // Use the computationType's string representation as a proxy since
    // ConceptComputationType enum is not yet ported.
    const ct = concept.computationType() as unknown as { name?: () => string; toString?: () => string };
    const name = (ct.name?.() ?? ct.toString?.() ?? "").toLowerCase();
    return name === "compilation";
  }

  //-------------------------------------------------------------------------

  /**
   * Check if a concept has BooleanData data type.
   * @java concept.dataType().equals(ConceptDataType.BooleanData) — escape hatch
   */
  private static _isBooleanDataType(concept: ConceptLike): boolean {
    const dt = concept.dataType() as unknown as { name?: () => string; toString?: () => string };
    const name = (dt.name?.() ?? dt.toString?.() ?? "").toLowerCase();
    return name === "booleandata" || name === "boolean";
  }

  //-------------------------------------------------------------------------

  // Suppress unused symbol warnings — these are kept for faithful mapping
  private static readonly _ConceptComputationTypeCompilation = ConceptComputationTypeCompilation;
  private static readonly _ConceptDataTypeBooleanData = ConceptDataTypeBooleanData;

  //-------------------------------------------------------------------------
}

// @java AI/src/function_approx/BoostedLinearFunction.java

/**
 * A linear function approximator that uses another linear function for boosting
 * (the effective params of this approximator are the sum of the trainable
 * params and the effective params of the boosting function).
 *
 * @java function_approx.BoostedLinearFunction
 * @author Dennis Soemers
 */

import { FVector } from "../../../Common/src/main/collections/FVector.js";
import { LinearFunction } from "./LinearFunction.js";
import type { WeightVector } from "./LinearFunction.js";

// ---------------------------------------------------------------------------

/**
 * Minimal WeightVector factory helper — mirrors new WeightVector(FVector).
 */
function makeWeightVector(fv: FVector): WeightVector {
  return {
    allWeights(): FVector { return fv; },
    dot(featureVector: import("./LinearFunction.js").FeatureVector): number {
      return (featureVector as unknown as { dotWith(w: FVector): number }).dotWith?.(fv) ?? 0;
    },
  };
}

// ---------------------------------------------------------------------------

/**
 * A linear function approximator that uses another linear function for boosting.
 *
 * @java function_approx.BoostedLinearFunction
 */
export class BoostedLinearFunction extends LinearFunction {

  // -------------------------------------------------------------------------

  /** Function of which we use the effective params for boosting */
  protected readonly booster: LinearFunction;

  // -------------------------------------------------------------------------

  /**
   * Constructor
   *
   * @param theta Trainable parameters vector
   * @param booster Linear function of which we add the parameters to our trainable parameters
   * @java BoostedLinearFunction(WeightVector, LinearFunction)
   */
  public constructor(theta: WeightVector, booster: LinearFunction) {
    super(theta);
    this.booster = booster;
  }

  // -------------------------------------------------------------------------

  /**
   * @return Vector of effective parameters, used for making predictions. For this
   *         class, the trainable params plus the effective params of the booster.
   * @java BoostedLinearFunction.effectiveParams()
   */
  public override effectiveParams(): WeightVector {
    const params = this.booster.effectiveParams().allWeights().copy();
    params.add(this.trainableParams().allWeights());
    return makeWeightVector(params);
  }

  // -------------------------------------------------------------------------

  /**
   * Writes Linear function to the given filepath.
   * @java BoostedLinearFunction.writeToFile(String, String[])
   */
  public override writeToFile(filepath: string, featureSetFiles: string[]): void {
    const lines: string[] = [];
    const weights = this.theta.allWeights();
    for (let i = 0; i < weights.dim(); ++i) {
      lines.push(String(weights.get(i)));
    }
    for (const fsf of featureSetFiles) {
      const name = fsf.replace(/\\/g, "/").split("/").pop() ?? fsf;
      lines.push("FeatureSet=" + name);
    }
    lines.push("Effective Params:");
    const effectiveParams = this.effectiveParams().allWeights();
    for (let i = 0; i < effectiveParams.dim(); ++i) {
      lines.push(String(effectiveParams.get(i)));
    }
    console.warn("BoostedLinearFunction.writeToFile: filepath=" + filepath, lines.join("\n"));
  }

  /**
   * @param filepath
   * @param booster
   * @return Reads linear function from the given filepath.
   * @java BoostedLinearFunction.boostedFromFile(String, LinearFunction)
   */
  public static boostedFromFile(filepath: string, booster: LinearFunction | null): BoostedLinearFunction | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs") as typeof import("fs");
      const content = fs.readFileSync(filepath, "utf8");
      const lines = content.split(/\r?\n/);
      let lineIdx = 0;

      const readFloats: number[] = [];
      let featureSetFile: string | null = null;
      let line = "";

      while (lineIdx < lines.length) {
        line = lines[lineIdx++]!;
        if (line === "") continue;
        if (line.startsWith("FeatureSet=")) {
          featureSetFile = line.substring("FeatureSet=".length);
        } else if (line === "Effective Params:") {
          break;
        } else {
          readFloats.push(parseFloat(line));
        }
      }

      const floats = new Float32Array(readFloats);

      let boosterFunc: LinearFunction | null = booster;
      if (boosterFunc === null) {
        // Don't have a booster, so create a dummy linear function as booster
        // such that the total effective params remain the same

        const effectiveParams: number[] = [];

        // we're first expecting a line saying "Effective Params:"
        if (line !== "Effective Params:") {
          console.error('Error in BoostedLinearFunction::boostedFromFile file! Expected line: "Effective Params:"');
        }

        while (lineIdx < lines.length) {
          line = lines[lineIdx++]!;
          if (line === "") continue;
          effectiveParams.push(parseFloat(line));
        }

        const boosterFloats = new Float32Array(effectiveParams.length);
        for (let i = 0; i < boosterFloats.length; ++i) {
          boosterFloats[i] = effectiveParams[i]! - floats[i]!;
        }

        boosterFunc = new LinearFunction(makeWeightVector(FVector.wrap(boosterFloats)));
      }

      const func = new BoostedLinearFunction(makeWeightVector(FVector.wrap(floats)), boosterFunc);
      func.setFeatureSetFile(featureSetFile);
      return func;
    } catch (e) {
      console.error("exception in BoostedLinearFunction.boostedFromFile: filepath=" + filepath, e);
    }
    return null;
  }

  // -------------------------------------------------------------------------
}

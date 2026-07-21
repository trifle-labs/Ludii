// @java AI/src/function_approx/LinearFunction.java

/**
 * A linear function approximator
 *
 * @java function_approx.LinearFunction
 * @author Dennis Soemers
 */

import { FVector } from "../../../Common/src/main/collections/FVector.js";

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported dependencies

/** @java features.FeatureVector */
export interface FeatureVector {
  __featureVector: true;
}

/** @java features.WeightVector */
export interface WeightVector {
  /** @java WeightVector.allWeights() */
  allWeights(): FVector;
  /** @java WeightVector.dot(FeatureVector) */
  dot(featureVector: FeatureVector): number;
}

/**
 * Minimal WeightVector factory helper (used in fromFile).
 * Mirrors: new WeightVector(FVector)
 */
function makeWeightVector(fv: FVector): WeightVector {
  return {
    allWeights(): FVector { return fv; },
    dot(featureVector: FeatureVector): number {
      // dot product via escape-hatch; real implementation depends on FeatureVector port
      return (featureVector as unknown as { dotWith(w: FVector): number }).dotWith?.(fv) ?? 0;
    },
  };
}

// ---------------------------------------------------------------------------

/**
 * A linear function approximator.
 *
 * @java function_approx.LinearFunction
 */
export class LinearFunction {

  // -------------------------------------------------------------------------

  /** Our vector of parameters / weights */
  protected theta: WeightVector;

  /** Filepath for feature set corresponding to our parameters */
  protected featureSetFileVal: string | null = null;

  // -------------------------------------------------------------------------

  /**
   * Constructor
   *
   * @param theta
   * @java LinearFunction(WeightVector)
   */
  public constructor(theta: WeightVector) {
    this.theta = theta;
  }

  // -------------------------------------------------------------------------

  /**
   * @param featureVector
   * @return Predicted value for a given feature vector
   * @java LinearFunction.predict(FeatureVector)
   */
  public predict(featureVector: FeatureVector): number {
    return this.effectiveParams().dot(featureVector);
  }

  /**
   * @return Vector of effective parameters, used for making predictions. For this
   *         class, a reference to theta.
   * @java LinearFunction.effectiveParams()
   */
  public effectiveParams(): WeightVector {
    return this.theta;
  }

  /**
   * @return Reference to parameters vector that we can train. For this class,
   *         a reference to theta.
   * @java LinearFunction.trainableParams()
   */
  public trainableParams(): WeightVector {
    return this.theta;
  }

  // -------------------------------------------------------------------------

  /**
   * Replaces the linear function's param vector theta
   * @param newTheta
   * @java LinearFunction.setTheta(WeightVector)
   */
  public setTheta(newTheta: WeightVector): void {
    this.theta = newTheta;
  }

  // -------------------------------------------------------------------------

  /**
   * @return Filename for corresponding Feature Set
   * @java LinearFunction.featureSetFile()
   */
  public featureSetFile(): string | null {
    return this.featureSetFileVal;
  }

  /**
   * Sets the filename for the corresponding Feature Set
   * @param featureSetFile
   * @java LinearFunction.setFeatureSetFile(String)
   */
  public setFeatureSetFile(featureSetFile: string | null): void {
    this.featureSetFileVal = featureSetFile;
  }

  // -------------------------------------------------------------------------

  /**
   * Writes linear function to the given filepath (browser-env stub).
   * @param filepath
   * @param featureSetFiles
   * @java LinearFunction.writeToFile(String, String[])
   */
  public writeToFile(filepath: string, featureSetFiles: string[]): void {
    const lines: string[] = [];
    const weights = this.theta.allWeights();
    for (let i = 0; i < weights.dim(); ++i) {
      lines.push(String(weights.get(i)));
    }
    for (const fsf of featureSetFiles) {
      // Java: new File(fsf).getName() — take basename
      const name = fsf.replace(/\\/g, "/").split("/").pop() ?? fsf;
      lines.push("FeatureSet=" + name);
    }
    // In a browser/Node environment, writing to disk requires Node fs.
    // Use escape-hatch console warning; callers that need real I/O should
    // use Node's fs module directly.
    console.warn("LinearFunction.writeToFile: filepath=" + filepath, lines.join("\n"));
  }

  /**
   * @param filepath
   * @return Reads linear function from the given filepath
   * @java LinearFunction.fromFile(String)
   */
  public static fromFile(filepath: string): LinearFunction | null {
    // In a browser/Node ESM context, synchronous file I/O requires Node.
    // This implementation uses a synchronous-style shim via the escape-hatch.
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs") as typeof import("fs");
      const content = fs.readFileSync(filepath, "utf8");
      const lines = content.split(/\r?\n/);
      const readFloats: number[] = [];
      let featureSetFile: string | null = null;

      for (const line of lines) {
        if (line === "") continue;
        if (line.startsWith("FeatureSet=")) {
          featureSetFile = line.substring("FeatureSet=".length);
        } else {
          readFloats.push(parseFloat(line));
        }
      }

      const floats = new Float32Array(readFloats);
      const func = new LinearFunction(makeWeightVector(FVector.wrap(floats)));
      func.setFeatureSetFile(featureSetFile);
      return func;
    } catch (e) {
      console.error("exception while trying to load from filepath: " + filepath, e);
    }
    return null;
  }

  // -------------------------------------------------------------------------
}

// @java Core/src/metadata/ai/features/Features.java

import type { FeatureSet } from "./FeatureSet.js";

/**
 * Describes one or more sets of features (local, geometric patterns) to be used by Biased MCTS agents.
 *
 * @author Dennis Soemers
 */
export class Features {
  /** Our array of feature sets */
  protected readonly featureSets: FeatureSet[];

  // -------------------------------------------------------------------------

  /**
   * For just a single feature set shared among players.
   * @param featureSet A single feature set.
   *
   * @example (features (featureSet All {
   * (pair "rel:to=<{}>:pat=<refl=true,rots=all,els=[-{}]>" 1.0) }))
   */
  constructor(featureSet: FeatureSet | null);

  /**
   * For multiple feature sets (one per player).
   * @param featureSets A sequence of multiple feature sets.
   *
   * @example (features {
   *   (featureSet P1 { (pair "rel:to=<{}>:pat=<els=[-{}]>" 1.0) })
   *   (featureSet P2 { (pair "rel:to=<{}>:pat=<els=[-{}]>" -1.0) })
   * })
   */
  constructor(featureSets: FeatureSet[] | null);

  constructor(fsOrFSs: FeatureSet | FeatureSet[] | null) {
    if (fsOrFSs == null) {
      this.featureSets = [];
    } else if (Array.isArray(fsOrFSs)) {
      this.featureSets = fsOrFSs;
    } else {
      this.featureSets = [fsOrFSs];
    }
  }

  // -------------------------------------------------------------------------

  /** @return Our array of feature sets */
  getFeatureSets(): FeatureSet[] {
    return this.featureSets;
  }

  // -------------------------------------------------------------------------

  toString(): string {
    let sb = "(features {\n";
    for (const featureSet of this.featureSets) {
      sb += featureSet.toString();
    }
    sb += "})\n";
    return sb;
  }

  /**
   * @param threshold
   * @return A string representation of these features, retaining only those for
   * which the absolute weights exceed the given threshold.
   */
  toStringThresholded(threshold: number): string {
    let sb = "(features {\n";
    for (const featureSet of this.featureSets) {
      sb += featureSet.toStringThresholded(threshold);
    }
    sb += "})\n";
    return sb;
  }
}

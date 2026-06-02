// @java Core/src/metadata/ai/heuristics/HeuristicUtil.java

import { Heuristics } from "./Heuristics.js";
import type { HeuristicTerm } from "./terms/HeuristicTerm.js";

/**
 * Utility functions for heuristic manipulation.
 *
 * @author Matthew.Stephenson
 */
export class HeuristicUtil {
  /**
   * @param heuristic
   * @return Normalises all weights on heuristic between -1 and 1.
   */
  static normaliseHeuristic(heuristic: Heuristics): Heuristics {
    let maxWeight = 0.0;
    for (const term of heuristic.getHeuristicTerms()) {
      maxWeight = Math.max(maxWeight, term.maxAbsWeight());
    }
    return new Heuristics(HeuristicUtil.multiplyHeuristicTerms(heuristic.getHeuristicTerms(), 1.0 / maxWeight));
  }

  /**
   * @param heuristicTerms
   * @param multiplier
   * @return Multiplies the weights for an array of heuristicTerms by the specified multiplier.
   */
  static multiplyHeuristicTerms(heuristicTerms: HeuristicTerm[], multiplier: number): HeuristicTerm[] {
    return heuristicTerms.map((term) => {
      const copy = term.copy();
      copy.setWeight(term.getWeight() * multiplier);
      return copy;
    });
  }

  /**
   * @param weight
   * @return Converts a (normalised) weight to a string by binning it.
   */
  static convertWeightToString(weight: number): string {
    const abs = Math.abs(weight);
    if (abs < 0.2) return "very low importance";
    if (abs < 0.4) return "low importance";
    if (abs < 0.6) return "moderate importance";
    if (abs < 0.8) return "high importance";
    return "very high importance";
  }
}

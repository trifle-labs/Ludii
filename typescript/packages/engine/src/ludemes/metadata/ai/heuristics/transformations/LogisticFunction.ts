// @java Core/src/metadata/ai/heuristics/transformations/LogisticFunction.java

import type { HeuristicTransformation } from "./HeuristicTransformation.js";

/**
 * Transforms heuristic scores by applying the logistic function to them:
 * f(x) = 1 / (1 + exp(x)).
 *
 * @remarks This guarantees that all transformed heuristic scores will lie
 * in [0, 1]. May map too many different values only to the limits of this
 * interval in practice.
 *
 * @author Dennis Soemers
 */
export class LogisticFunction implements HeuristicTransformation {
  /**
   * @example (logisticFunction)
   */
  constructor() {
    // Do nothing
  }

  transform(_context: unknown, heuristicScore: number): number {
    return 1.0 / (1.0 + Math.exp(heuristicScore));
  }

  toString(): string {
    return "(logisticFunction)";
  }
}

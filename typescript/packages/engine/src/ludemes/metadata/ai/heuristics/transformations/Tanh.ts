// @java Core/src/metadata/ai/heuristics/transformations/Tanh.java

import type { HeuristicTransformation } from "./HeuristicTransformation.js";

/**
 * Transforms heuristic scores by applying the tanh to them: f(x) = tanh(x).
 *
 * @remarks This guarantees that all transformed heuristic scores will lie
 * in [-1, 1]. May map too many different values only to the limits of this
 * interval in practice.
 *
 * @author Dennis Soemers
 */
export class Tanh implements HeuristicTransformation {
  /**
   * @example (tanh)
   */
  constructor() {
    // Do nothing
  }

  transform(_context: unknown, heuristicScore: number): number {
    return Math.tanh(heuristicScore);
  }

  toString(): string {
    return "(tanh)";
  }
}

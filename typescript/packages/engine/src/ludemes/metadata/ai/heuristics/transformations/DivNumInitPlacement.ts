// @java Core/src/metadata/ai/heuristics/transformations/DivNumInitPlacement.java

import type { HeuristicTransformation } from "./HeuristicTransformation.js";

/**
 * Transforms heuristic scores by dividing them by the number of pieces
 * placed in a game's initial game state.
 *
 * @remarks Can be used to approximately standardise heuristic values across
 * games with different initial numbers of pieces.
 *
 * @author Dennis Soemers
 */
export class DivNumInitPlacement implements HeuristicTransformation {
  /**
   * @example (divNumInitPlacement)
   */
  constructor() {
    // Do nothing
  }

  transform(context: unknown, heuristicScore: number): number {
    // Java: Math.max(1, context.trial().numInitPlacement())
    const numInitPlacement = Math.max(
      1,
      (context as { trial?: () => { numInitPlacement?: () => number } })
        ?.trial?.()?.numInitPlacement?.() ?? 1,
    );
    return heuristicScore / numInitPlacement;
  }

  toString(): string {
    return "(divNumInitPlacement)";
  }
}

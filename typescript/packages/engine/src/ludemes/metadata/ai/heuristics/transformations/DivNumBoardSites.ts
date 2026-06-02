// @java Core/src/metadata/ai/heuristics/transformations/DivNumBoardSites.java

import type { HeuristicTransformation } from "./HeuristicTransformation.js";

/**
 * Transforms heuristic scores by dividing them by the number of sites
 * in a game's board.
 *
 * @remarks Can be used to approximately standardise heuristic values across
 * games with different board sizes.
 *
 * @author Dennis Soemers
 */
export class DivNumBoardSites implements HeuristicTransformation {
  /**
   * @example (divNumBoardSites)
   */
  constructor() {
    // Do nothing
  }

  transform(context: unknown, heuristicScore: number): number {
    // Java: heuristicScore / context.game().board().numSites()
    // Context is opaque for metadata; caller must wire in at runtime.
    const numSites = (context as { game?: () => { board?: () => { numSites?: () => number } } })
      ?.game?.()?.board?.()?.numSites?.() ?? 1;
    return heuristicScore / numSites;
  }

  toString(): string {
    return "(divNumBoardSites)";
  }
}

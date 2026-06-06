// @java Mining/src/gameDistance/metrics/bagOfWords/Overlap.java

import type { DistanceMetric, DatasetLike, GameLike } from "../DistanceMetric.js";

//-----------------------------------------------------------------------------

/**
 * Percentage of overlapping entries.
 *
 * @java gameDistance.metrics.bagOfWords.Overlap
 * @author Matthew.Stephenson
 */

/** Java Constants.EPSILON = 1.0E-6 */
const EPSILON = 1.0e-6;

/** @java Overlap */
export class Overlap implements DistanceMetric {

  /**
   * @java Overlap.distance(Dataset, Map, Game, Game)
   */
  public distance(
    dataset: DatasetLike,
    vocabulary: Map<string, number>,
    gameA: GameLike,
    gameB: GameLike
  ): number {
    const datasetA = dataset.getBagOfWords(gameA);
    const datasetB = dataset.getBagOfWords(gameB);

    let nominator = 0.0;
    const denominator = vocabulary.size;
    for (const word of vocabulary.keys()) {
      let existsA = false;
      let existsB = false;

      if (datasetA.has(word))
        existsA = datasetA.get(word)! > 0.5;
      if (datasetB.has(word))
        existsB = datasetB.get(word)! > 0.5;

      if (existsA === existsB)
        nominator += 1;
    }
    const finalVal = 1 - (nominator / denominator);

    // Handle floating point imprecision
    if (finalVal < EPSILON)
      return 0;

    return finalVal;
  }

}

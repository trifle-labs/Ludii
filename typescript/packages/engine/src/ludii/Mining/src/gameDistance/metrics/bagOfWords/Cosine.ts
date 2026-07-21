// @java Mining/src/gameDistance/metrics/bagOfWords/Cosine.java

import type { DistanceMetric, DatasetLike, GameLike } from "../DistanceMetric.js";

//-----------------------------------------------------------------------------

/**
 * https://en.wikipedia.org/wiki/Cosine_similarity
 *
 * @java gameDistance.metrics.bagOfWords.Cosine
 * @author Matthew.Stephenson, Markus
 */

// DistanceUtils.getGameDataset helper (inline since DistanceUtils is not yet ported)
function getGameDataset(dataset: DatasetLike, game: GameLike): Map<string, number> {
  const datasetGame = new Map<string, number>(dataset.getBagOfWords(game));
  let valueSum = 0.0;
  for (const v of datasetGame.values()) valueSum += v;
  if (valueSum !== 0.0) {
    for (const [k, v] of datasetGame.entries()) datasetGame.set(k, v / valueSum);
  }
  return datasetGame;
}

/** Java Constants.EPSILON = 1.0E-6 */
const EPSILON = 1.0e-6;

/** @java Cosine */
export class Cosine implements DistanceMetric {

  /**
   * @java Cosine.distance(Dataset, Map, Game, Game)
   */
  public distance(
    dataset: DatasetLike,
    vocabulary: Map<string, number>,
    gameA: GameLike,
    gameB: GameLike
  ): number {
    const datasetA = getGameDataset(dataset, gameA);
    const datasetB = getGameDataset(dataset, gameB);

    let nominator = 0.0;
    let denominatorA = 0.0;
    let denominatorB = 0.0;
    for (const [word, vocabWeight] of vocabulary.entries()) {
      let frqA = 0.0;
      let frqB = 0.0;

      if (datasetA.has(word))
        frqA = datasetA.get(word)! * vocabWeight;
      if (datasetB.has(word))
        frqB = datasetB.get(word)! * vocabWeight;

      nominator += frqA * frqB;
      denominatorA += frqA * frqA;
      denominatorB += frqB * frqB;
    }
    const denominator = Math.sqrt(denominatorA) * Math.sqrt(denominatorB);
    const finalVal = 1 - (nominator / denominator);

    // Handle floating point imprecision
    if (finalVal < EPSILON)
      return 0;

    return finalVal;
  }

}

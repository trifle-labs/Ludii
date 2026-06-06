// @java Mining/src/gameDistance/metrics/bagOfWords/Jaccard.java

import type { DistanceMetric, DatasetLike, GameLike } from "../DistanceMetric.js";

//-----------------------------------------------------------------------------

/**
 * https://en.wikipedia.org/wiki/Jaccard_index
 *
 * @java gameDistance.metrics.bagOfWords.Jaccard
 * @author Matthew.Stephenson, Markus
 */

// DistanceUtils.getGameDataset helper (inline since DistanceUtils is not yet ported)
function getGameDataset(dataset: DatasetLike, game: GameLike): Map<string, number> {
  const datasetGame = new Map<string, number>(dataset.getBagOfWords(game));
  // Convert raw frequency counts into probability distributions.
  let valueSum = 0.0;
  for (const v of datasetGame.values()) valueSum += v;
  if (valueSum !== 0.0) {
    for (const [k, v] of datasetGame.entries()) datasetGame.set(k, v / valueSum);
  }
  return datasetGame;
}

/** @java Jaccard */
export class Jaccard implements DistanceMetric {

  /**
   * @java Jaccard.distance(Dataset, Map, Game, Game)
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
    let denominator = 0.0;
    for (const [word, vocabWeight] of vocabulary.entries()) {
      let frqA = 0.0;
      let frqB = 0.0;

      if (datasetA.has(word))
        frqA = datasetA.get(word)! * vocabWeight;
      if (datasetB.has(word))
        frqB = datasetB.get(word)! * vocabWeight;

      nominator += Math.min(frqA, frqB);
      denominator += Math.max(frqA, frqB);
    }
    const finalVal = 1 - (nominator / denominator);

    return finalVal;
  }

}

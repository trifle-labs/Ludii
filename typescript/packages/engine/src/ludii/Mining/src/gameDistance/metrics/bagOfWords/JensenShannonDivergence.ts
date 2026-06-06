// @java Mining/src/gameDistance/metrics/bagOfWords/JensenShannonDivergence.java

import type { DistanceMetric, DatasetLike, GameLike } from "../DistanceMetric.js";

//-----------------------------------------------------------------------------

/**
 * https://en.wikipedia.org/wiki/Jensen%E2%80%93Shannon_divergence
 *
 * @java gameDistance.metrics.bagOfWords.JensenShannonDivergence
 * @author Matthew.Stephenson, Sofia, Markus
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

/** @java JensenShannonDivergence */
export class JensenShannonDivergence implements DistanceMetric {

  /**
   * @java JensenShannonDivergence.distance(Dataset, Map, Game, Game)
   */
  public distance(
    dataset: DatasetLike,
    vocabulary: Map<string, number>,
    gameA: GameLike,
    gameB: GameLike
  ): number {
    const datasetA = getGameDataset(dataset, gameA);
    const datasetB = getGameDataset(dataset, gameB);

    let klDiv1 = 0.0;
    let klDiv2 = 0.0;

    for (const [word, vocabWeight] of vocabulary.entries()) {
      let valA = 0.0;
      let valB = 0.0;

      if (datasetA.has(word))
        valA = datasetA.get(word)! * vocabWeight;
      if (datasetB.has(word))
        valB = datasetB.get(word)! * vocabWeight;

      const avg = (valA + valB) / 2.0;
      // assert (avg !== 0.0);

      if (valA !== 0.0)
        klDiv1 += valA * Math.log(valA / avg);

      if (valB !== 0.0)
        klDiv2 += valB * Math.log(valB / avg);
    }

    const jensonsShannonDivergence = (klDiv1 + klDiv2) / 2.0 / Math.log(2);

    return jensonsShannonDivergence;
  }

}

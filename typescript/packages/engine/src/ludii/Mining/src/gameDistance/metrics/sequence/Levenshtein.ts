// @java Mining/src/gameDistance/metrics/sequence/Levenshtein.java

import type { DistanceMetric, DatasetLike, GameLike } from "../DistanceMetric.js";

//-----------------------------------------------------------------------------

/**
 * https://en.wikipedia.org/wiki/Levenshtein_distance
 *
 * @java gameDistance.metrics.sequence.Levenshtein
 * @author Matthew.Stephenson, Markus
 */
export class Levenshtein implements DistanceMetric {

  /**
   * @java Levenshtein.distance(Dataset, Map, Game, Game)
   */
  public distance(
    dataset: DatasetLike,
    _vocabulary: Map<string, number>,
    gameA: GameLike,
    gameB: GameLike
  ): number {
    const gameAString: string[] = dataset.getSequence(gameA);
    const gameBString: string[] = dataset.getSequence(gameB);

    const costs: number[] = new Array<number>(gameBString.length + 1);

    for (let j = 0; j < costs.length; j++)
      costs[j] = j;

    for (let i = 1; i <= gameAString.length; i++) {
      costs[0] = i;
      let nw = i - 1;
      for (let j = 1; j <= gameBString.length; j++) {
        const cj = Math.min(
          1 + Math.min(costs[j]!, costs[j - 1]!),
          gameAString[i - 1] === gameBString[j - 1] ? nw : nw + 1
        );
        nw = costs[j]!;
        costs[j] = cj;
      }
    }

    const edits = costs[gameBString.length]!;
    const maxLength = Math.max(gameAString.length, gameBString.length);
    const score = edits / maxLength;
    return score;
  }

}

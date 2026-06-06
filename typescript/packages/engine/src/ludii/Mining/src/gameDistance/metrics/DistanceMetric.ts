// @java Mining/src/gameDistance/metrics/DistanceMetric.java

/**
 * Interface for distance metric classes.
 *
 * @java gameDistance.metrics.DistanceMetric
 * @author Matthew.Stephenson
 */

// Not-yet-ported dependency escape-hatch interfaces
type GameLike = { name: () => string };
type DatasetLike = {
  getBagOfWords: (game: GameLike) => Map<string, number>;
  getSequence: (game: GameLike) => string[];
  getTree: (game: GameLike) => TreeLike;
};
type TreeLike = {
  size: () => number;
  bracketNotation: () => string;
};

export type { GameLike, DatasetLike, TreeLike };

/** @java DistanceMetric */
export interface DistanceMetric {
  /**
   * @return Estimated distance between two games.
   * @java DistanceMetric.distance(Dataset, Map, Game, Game)
   */
  distance(
    dataset: DatasetLike,
    vocabulary: Map<string, number>,
    gameA: GameLike,
    gameB: GameLike
  ): number;
}

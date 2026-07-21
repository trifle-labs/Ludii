// @java Mining/src/gameDistance/metrics/treeEdit/ZhangShasha.java

import { Tree } from "../../../../../AI/src/utils/data_structures/support/zhang_shasha/Tree.js";
import type { DistanceMetric, DatasetLike, GameLike } from "../DistanceMetric.js";

//-----------------------------------------------------------------------------

/**
 * Returns Zhang-Shasha tree edit distance.
 * https://www.researchgate.net/publication/220618233_Simple_Fast_Algorithms_for_the_Editing_Distance_Between_Trees_and_Related_Problems
 *
 * @java gameDistance.metrics.treeEdit.ZhangShasha
 * @author matthew.stephenson
 */
export class ZhangShasha implements DistanceMetric {

  //---------------------------------------------------------------------

  /**
   * @java ZhangShasha.distance(Dataset, Map, Game, Game)
   */
  public distance(
    dataset: DatasetLike,
    _vocabulary: Map<string, number>,
    gameA: GameLike,
    gameB: GameLike
  ): number {
    const treeA = dataset.getTree(gameA) as unknown as Tree;
    const treeB = dataset.getTree(gameB) as unknown as Tree;

    const edits = Tree.ZhangShasha(treeA, treeB);

    const maxTreeSize = Math.max(treeA.size(), treeB.size());

    return edits / maxTreeSize;
  }

  //---------------------------------------------------------------------

}

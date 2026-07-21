// @java Mining/src/gameDistance/datasets/sequence/StateConceptDataset.java

import type { Dataset } from "../Dataset.js";
import type { GameLike, TreeLike } from "../../metrics/DistanceMetric.js";

/**
 * Dataset containing state concepts from trials.
 * - BagOfWords
 * - Sequence
 *
 * @java gameDistance.datasets.sequence.StateConceptDataset
 * @author matthew.stephenson
 */
export class StateConceptDataset implements Dataset {

  /** @java StateConceptDataset.getBagOfWords(Game) */
  public getBagOfWords(_game: GameLike): Map<string, number> {
    return null as unknown as Map<string, number>;
  }

  /** @java StateConceptDataset.getSequence(Game) */
  public getSequence(_game: GameLike): string[] {
    return null as unknown as string[];
  }

  /**
   * Not Supported
   * @java StateConceptDataset.getTree(Game)
   */
  public getTree(_game: GameLike): TreeLike {
    return null as unknown as TreeLike;
  }
}

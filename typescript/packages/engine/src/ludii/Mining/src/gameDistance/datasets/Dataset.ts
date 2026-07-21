// @java Mining/src/gameDistance/datasets/Dataset.java

import type { DatasetLike, GameLike, TreeLike } from "../metrics/DistanceMetric.js";

/**
 * Interface for game dataset classes.
 *
 * @java gameDistance.datasets.Dataset
 * @author Matthew.Stephenson
 */
export interface Dataset extends DatasetLike {
	/**
	 * @return dataset in a bag of words format <FeatureName, FeatureValue>
	 * @java Dataset.getBagOfWords(Game)
	 */
	getBagOfWords(game: GameLike): Map<string, number>;

	/**
	 * @return dataset in a sequence format.
	 * @java Dataset.getSequence(Game)
	 */
	getSequence(game: GameLike): string[];

	/**
	 * @return dataset in a tree format.
	 * @java Dataset.getTree(Game)
	 */
	getTree(game: GameLike): TreeLike;
}

// @java Mining/src/gameDistance/datasets/bagOfWords/AIResultDataset.java

import type { Dataset } from "../Dataset.js";
import type { GameLike, TreeLike } from "../../metrics/DistanceMetric.js";

/**
 * Dataset containing performance results of different AI.
 * - BagOfWords
 *
 * @java gameDistance.datasets.bagOfWords.AIResultDataset
 * @author matthew.stephenson
 */
export class AIResultDataset implements Dataset {

	/**
	 * @java AIResultDataset.getBagOfWords(Game)
	 */
	public getBagOfWords(_game: GameLike): Map<string, number> {
		return null as unknown as Map<string, number>;
	}

	/**
	 * Not Supported
	 * @java AIResultDataset.getSequence(Game)
	 */
	public getSequence(_game: GameLike): string[] {
		return null as unknown as string[];
	}

	/**
	 * Not Supported
	 * @java AIResultDataset.getTree(Game)
	 */
	public getTree(_game: GameLike): TreeLike {
		return null as unknown as TreeLike;
	}

}

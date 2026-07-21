// @java Mining/src/gameDistance/datasets/bagOfWords/NGramDataset.java

import type { Dataset } from "../Dataset.js";
import type { GameLike, TreeLike } from "../../metrics/DistanceMetric.js";

//---------------------------------------------------------------------

/**
 * Converts a Sequence-possible dataset into a BagOfWords equivalent based on NGram sets.
 * - BagOfWords
 *
 * @java gameDistance.datasets.bagOfWords.NGramDataset
 * @author matthew.stephenson
 */
export class NGramDataset implements Dataset {

	//---------------------------------------------------------------------

	/** @java NGramDataset.originalDataset */
	originalDataset: Dataset;
	/** @java NGramDataset.nGramLength */
	nGramLength: number;

	//---------------------------------------------------------------------

	/**
	 * Make sure to call this constructor with a dataset that provides a sequence output format.
	 * @java NGramDataset(Dataset, int)
	 */
	public constructor(originalDataset: Dataset, nGramLength: number) {
		this.originalDataset = originalDataset;
		this.nGramLength = nGramLength;
	}

	//---------------------------------------------------------------------

	/**
	 * @java NGramDataset.getBagOfWords(Game)
	 */
	public getBagOfWords(game: GameLike): Map<string, number> {
		return NGramDataset.convertSequenceToNGram(this.originalDataset.getSequence(game), this.nGramLength);
	}

	/**
	 * Not Supported
	 * @java NGramDataset.getSequence(Game)
	 */
	public getSequence(_game: GameLike): string[] {
		return null as unknown as string[];
	}

	/**
	 * Not Supported
	 * @java NGramDataset.getTree(Game)
	 */
	public getTree(_game: GameLike): TreeLike {
		return null as unknown as TreeLike;
	}

	//---------------------------------------------------------------------

	/**
	 * Converts from a sequence dataset output to an NGrams bagOfWords output.
	 * @java NGramDataset.convertSequenceToNGram(List, int)
	 */
	public static convertSequenceToNGram(sequence: string[], n: number): Map<string, number> {
		const featureMap = new Map<string, number>();

		const allNGrams: string[][] = [];
		for (let i = 0; i < sequence.length - n; i++)
			allNGrams.push(sequence.slice(i, i + n));

		const allNGramStrings: string[] = [];
		for (let i = 0; i < allNGrams.length; i++)
			allNGramStrings.push((allNGrams[i] ?? []).join("_"));

		for (const nGramString of allNGramStrings) {
			if (featureMap.has(nGramString))
				featureMap.set(nGramString, featureMap.get(nGramString)! + 1.0);
			else
				featureMap.set(nGramString, 1.0);
		}

		return featureMap;
	}

	//---------------------------------------------------------------------

}

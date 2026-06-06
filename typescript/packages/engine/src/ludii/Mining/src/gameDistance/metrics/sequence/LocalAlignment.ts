// @java Mining/src/gameDistance/metrics/sequence/LocalAlignment.java

import type { DistanceMetric, DatasetLike, GameLike } from "../DistanceMetric.js";
import { DistanceUtils } from "../../utils/DistanceUtils.js";

//-----------------------------------------------------------------------------

/**
 * Uses Smith Waterman Alignment, which is a local alignment of ludemes
 * https://en.wikipedia.org/wiki/Smith%E2%80%93Waterman_algorithm
 *
 * @java gameDistance.metrics.sequence.LocalAlignment
 * @author Matthew.Stephenson, Markus
 */
export class LocalAlignment implements DistanceMetric {

	//-----------------------------------------------------------------------------

	/**
	 * @java LocalAlignment.distance(Dataset, Map, Game, Game)
	 */
	public distance(
		dataset: DatasetLike,
		_vocabulary: Map<string, number>,
		gameA: GameLike,
		gameB: GameLike
	): number {
		const gameAString: string[] = dataset.getSequence(gameA);
		const gameBString: string[] = dataset.getSequence(gameB);

		const wordsA: string[] = gameAString.slice();
		const wordsB: string[] = gameBString.slice();

		const d = LocalAlignment.smithWatermanAlignment(wordsA, wordsB);
		const maxCost = Math.max(wordsA.length, wordsB.length) * DistanceUtils.HIT_VALUE;
		const finalScore = 1 - d / maxCost;

		return finalScore;
	}

	//-----------------------------------------------------------------------------

	// Smith Waterman Alignment
	// https://en.wikipedia.org/wiki/Smith%E2%80%93Waterman_algorithm
	/**
	 * @java LocalAlignment.smithWatermanAlignment(String[], String[])
	 */
	private static smithWatermanAlignment(wordsA: string[], wordsB: string[]): number {
		let maximumValue = 0;
		const rows = wordsA.length + 1;
		const cols = wordsB.length + 1;
		// Flat number[] for 2D access: distances[i * cols + j]
		const distances: number[] = new Array<number>(rows * cols).fill(0);
		for (let i = 1; i < rows; i++) {
			for (let j = 1; j < cols; j++) {
				// Non-null assertions safe: indices guaranteed in-bounds by loop
				const valueFromLeft = DistanceUtils.GAP_PENALTY + distances[(i - 1) * cols + j]!;
				const valueFromTop = DistanceUtils.GAP_PENALTY + distances[i * cols + (j - 1)]!;

				let valueFromTopLeft: number;
				if (wordsA[i - 1] === wordsB[j - 1])
					valueFromTopLeft = DistanceUtils.HIT_VALUE + distances[(i - 1) * cols + (j - 1)]!;
				else
					valueFromTopLeft = DistanceUtils.MISS_VALUE + distances[(i - 1) * cols + (j - 1)]!;

				const finalVal = Math.max(0, Math.max(valueFromTopLeft, Math.max(valueFromTop, valueFromLeft)));
				distances[i * cols + j] = finalVal;

				if (finalVal > maximumValue)
					maximumValue = finalVal;
			}
		}

		return maximumValue;
	}

	//-----------------------------------------------------------------------------

}

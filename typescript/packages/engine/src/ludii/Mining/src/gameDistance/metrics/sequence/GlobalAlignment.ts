// @java Mining/src/gameDistance/metrics/sequence/GlobalAlignment.java

import type { DistanceMetric, DatasetLike, GameLike } from "../DistanceMetric.js";
import { DistanceUtils } from "../../utils/DistanceUtils.js";

//-----------------------------------------------------------------------------

/**
 * Uses the NeedlemanWunsch algorithm to align the ludemes.
 * https://en.wikipedia.org/wiki/Needleman%E2%80%93Wunsch_algorithm
 *
 * @java gameDistance.metrics.sequence.GlobalAlignment
 * @author Matthew.Stephenson, Markus
 */
export class GlobalAlignment implements DistanceMetric {

	//-----------------------------------------------------------------------------

	/**
	 * @java GlobalAlignment.distance(Dataset, Map, Game, Game)
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

		const d = GlobalAlignment.needlemanWunshAllignment(wordsA, wordsB);
		const finalScore = 1.0 - (d / Math.max(wordsA.length, wordsB.length) / GlobalAlignment.maxValue());
		return finalScore;
	}

	//-----------------------------------------------------------------------------

	/**
	 * @java GlobalAlignment.needlemanWunshAllignment(String[], String[])
	 */
	private static needlemanWunshAllignment(wordsA: string[], wordsB: string[]): number {
		let maximumValue = 0;
		// Use a flat number[] for 2D access: distances[i * cols + j]
		const rows = wordsA.length + 1;
		const cols = wordsB.length + 1;
		const distances: number[] = new Array<number>(rows * cols).fill(0);
		for (let i = 0; i < rows; i++)
			distances[i * cols + 0] = i * DistanceUtils.GAP_PENALTY;
		for (let j = 0; j < cols; j++)
			distances[0 * cols + j] = j * DistanceUtils.GAP_PENALTY;

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

				const finalVal = Math.max(valueFromTopLeft, Math.max(valueFromTop, valueFromLeft));
				distances[i * cols + j] = finalVal;

				if (finalVal > maximumValue)
					maximumValue = finalVal;
			}
		}

		return distances[(rows - 1) * cols + (cols - 1)]!;
	}

	//-----------------------------------------------------------------------------

	/**
	 * @java GlobalAlignment.maxValue()
	 */
	private static maxValue(): number {
		const first = Math.max(Math.abs(DistanceUtils.HIT_VALUE), Math.abs(DistanceUtils.GAP_PENALTY));
		const second = Math.max(first, Math.abs(DistanceUtils.MISS_VALUE));
		return second;
	}

	//-----------------------------------------------------------------------------

}

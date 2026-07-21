// @java Mining/src/gameDistance/metrics/sequence/RepeatedLocalAlignment.java

import type { DistanceMetric, DatasetLike, GameLike } from "../DistanceMetric.js";
import { DistanceUtils } from "../../utils/DistanceUtils.js";

//-----------------------------------------------------------------------------

/**
 * Uses repeated Smith Waterman Alignment, which is a local alignment of ludemes
 * https://en.wikipedia.org/wiki/Smith%E2%80%93Waterman_algorithm
 *
 * @java gameDistance.metrics.sequence.RepeatedLocalAlignment
 * @author Matthew.Stephenson, Markus
 */
export class RepeatedLocalAlignment implements DistanceMetric {

	//-----------------------------------------------------------------------------

	/**
	 * @java RepeatedLocalAlignment.distance(Dataset, Map, Game, Game)
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

		const d = this.repeatedSmithWatermanAlignment(wordsA, wordsB, 0);
		const maxCost = Math.max(wordsA.length, wordsB.length) * DistanceUtils.HIT_VALUE;
		const finalScore = 1 - d / maxCost;

		return finalScore;
	}

	//-----------------------------------------------------------------------------

	/**
	 * Find the maximum value and then backtrack along the biggest numbers to 0.
	 * @java RepeatedLocalAlignment.repeatedSmithWatermanAlignment(String[], String[], int)
	 */
	private repeatedSmithWatermanAlignment(wordsA: string[], wordsB: string[], score: number): number {
		if (wordsA.length === 0 || wordsB.length === 0)
			return score;

		let maximumValue = -1;
		let maximumI = 0;
		let maximumJ = 0;

		const rows = wordsA.length + 1;
		const cols = wordsB.length + 1;
		// Flat number[] for 2D access: scoreMat[i * cols + j]
		const scoreMat: number[] = new Array<number>(rows * cols).fill(0);

		for (let i = 1; i < rows; i++) {
			for (let j = 1; j < cols; j++) {
				// Non-null assertions safe: indices guaranteed in-bounds by loop
				const valueFromLeft = DistanceUtils.GAP_PENALTY + scoreMat[(i - 1) * cols + j]!;
				const valueFromTop = DistanceUtils.GAP_PENALTY + scoreMat[i * cols + (j - 1)]!;

				let valueFromTopLeft: number;
				if (wordsA[i - 1] === wordsB[j - 1])
					valueFromTopLeft = DistanceUtils.HIT_VALUE + scoreMat[(i - 1) * cols + (j - 1)]!;
				else
					valueFromTopLeft = DistanceUtils.MISS_VALUE + scoreMat[(i - 1) * cols + (j - 1)]!;

				const finalVal = Math.max(0, Math.max(valueFromTopLeft, Math.max(valueFromTop, valueFromLeft)));
				scoreMat[i * cols + j] = finalVal;

				if (finalVal > maximumValue) {
					maximumValue = finalVal;
					maximumI = i;
					maximumJ = j;
				}
			}
		}

		const ij = this.findStartIJfromAllignmentMatrix(scoreMat, cols, maximumI, maximumJ);

		if (maximumValue < DistanceUtils.HIT_VALUE * 3)
			return score + maximumValue;

		if (ij[0] === maximumI || ij[1] === maximumJ)
			return score;

		// Java: scoreMat = null
		const wordsACut = RepeatedLocalAlignment.cutAwayAlligned(wordsA, ij[0]! - 1, maximumI - 1);
		const wordsBCut = RepeatedLocalAlignment.cutAwayAlligned(wordsB, ij[1]! - 1, maximumJ - 1);

		return this.repeatedSmithWatermanAlignment(wordsACut, wordsBCut, score + maximumValue);
	}

	//-----------------------------------------------------------------------------

	/**
	 * Travel along the maximum values starting from this cell.
	 * @java RepeatedLocalAlignment.findStartIJfromAllignmentMatrix(int[][], int, int)
	 */
	private findStartIJfromAllignmentMatrix(
		scoreMat: number[],
		cols: number,
		i: number,
		j: number
	): number[] {
		let nextI: number;
		let nextJ: number;
		let maxProgenitor: number;

		const leftUp: number = scoreMat[(i - 1) * cols + (j - 1)] ?? 0;
		maxProgenitor = leftUp;
		nextI = i - 1;
		nextJ = j - 1;

		const up: number = scoreMat[i * cols + (j - 1)] ?? 0;
		if (up > maxProgenitor) {
			maxProgenitor = up;
			nextI = i;
			nextJ = j - 1;
		}

		const left: number = scoreMat[(i - 1) * cols + j] ?? 0;
		if (left > maxProgenitor) {
			maxProgenitor = left;
			nextI = i - 1;
			nextJ = j;
		}

		if (maxProgenitor === 0)
			return [i, j];
		else
			return this.findStartIJfromAllignmentMatrix(scoreMat, cols, nextI, nextJ);
	}

	//-----------------------------------------------------------------------------

	/**
	 * @java RepeatedLocalAlignment.cutAwayAlligned(String[], int, int)
	 */
	private static cutAwayAlligned(wordsA: string[], minI: number, maximumI: number): string[] {
		const firstLength = minI;
		const tailLength = wordsA.length - maximumI - 1;
		const newLength = minI + tailLength;
		const cutted = new Array<string>(newLength);

		for (let i = 0; i < firstLength; i++)
			cutted[i] = wordsA[i] ?? "";
		for (let i = 0; i < tailLength; i++)
			cutted[firstLength + i] = wordsA[maximumI + 1 + i] ?? "";

		return cutted;
	}

	//-----------------------------------------------------------------------------

}

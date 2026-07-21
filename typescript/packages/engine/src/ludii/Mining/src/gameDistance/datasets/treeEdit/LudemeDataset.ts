// @java Mining/src/gameDistance/datasets/treeEdit/LudemeDataset.java

import type { Dataset } from "../Dataset.js";
import type { GameLike, TreeLike } from "../../metrics/DistanceMetric.js";
import { GetLudemeInfo } from "../../../ludemeplexDetection/GetLudemeInfo.js";
import type { LudemeInfo } from "../../../../../Common/src/main/grammar/LudemeInfo.js";
import type { Call } from "../../../../../Common/src/main/grammar/Call.js";
import { Tree } from "../../../../../AI/src/utils/data_structures/support/zhang_shasha/Tree.js";

/**
 * Dataset containing ludemes used for each game's description.
 * - BagOfWords
 * - Sequence
 * - Tree
 *
 * @java gameDistance.datasets.treeEdit.LudemeDataset
 * @author matthew.stephenson
 */
export class LudemeDataset implements Dataset {

	//-------------------------------------------------------------------------

	/**
	 * @java LudemeDataset.getBagOfWords(Game)
	 */
	public getBagOfWords(game: GameLike): Map<string, number> {
		const allLudemes: LudemeInfo[] = GetLudemeInfo.getLudemeInfo();

		// Initialise all values to zero
		const featureMap = new Map<string, number>();
		for (const ludeme of allLudemes)
			featureMap.set(ludeme.symbol().name(), 0.0);

		const gameWithDesc = game as unknown as { description(): { callTree(): Call } };
		const callTree: Call = gameWithDesc.description().callTree();
		// analysisFormat returns Map<LudemeInfo, ...> — use escape hatch
		const analysisMap: Map<LudemeInfo, unknown> = (callTree as unknown as {
			analysisFormat(depth: number, ludemes: LudemeInfo[]): Map<LudemeInfo, unknown>
		}).analysisFormat(0, allLudemes);

		for (const ludeme of analysisMap.keys())
			featureMap.set(ludeme.symbol().name(), (featureMap.get(ludeme.symbol().name()) ?? 0.0) + 1.0);

		return featureMap;
	}

	//-------------------------------------------------------------------------

	/**
	 * @java LudemeDataset.getSequence(Game)
	 */
	public getSequence(game: GameLike): string[] {
		const allLudemes: LudemeInfo[] = GetLudemeInfo.getLudemeInfo();
		const gameWithDesc = game as unknown as { description(): { callTree(): Call } };
		const callTree: Call = gameWithDesc.description().callTree();
		const analysisMap: Map<LudemeInfo, unknown> = (callTree as unknown as {
			analysisFormat(depth: number, ludemes: LudemeInfo[]): Map<LudemeInfo, unknown>
		}).analysisFormat(0, allLudemes);

		const ludemeSequence: string[] = [];
		for (const ludeme of analysisMap.keys())
			ludemeSequence.push(ludeme.symbol().name());

		return ludemeSequence;
	}

	//-------------------------------------------------------------------------

	/**
	 * @java LudemeDataset.getTree(Game)
	 */
	public getTree(game: GameLike): TreeLike {
		const allLudemes: LudemeInfo[] = GetLudemeInfo.getLudemeInfo();
		const gameWithDesc = game as unknown as { description(): { callTree(): Call } };
		const callTree: Call = gameWithDesc.description().callTree();
		const gameLudemes: string = (callTree as unknown as {
			preorderFormat(depth: number, ludemes: LudemeInfo[]): string
		}).preorderFormat(0, allLudemes);
		const ludemeTree: Tree = new Tree(gameLudemes);
		return ludemeTree as unknown as TreeLike;
	}

	//-------------------------------------------------------------------------

}

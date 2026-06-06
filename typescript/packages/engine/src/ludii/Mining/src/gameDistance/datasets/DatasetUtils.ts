// @java Mining/src/gameDistance/datasets/DatasetUtils.java

import type { GameLike } from "../metrics/DistanceMetric.js";
import type { Trial } from "../../../../../trial.js";
import type { MatchRecord } from "../../../../Manager/src/manager/utils/game_logs/MatchRecord.js";

/**
 * Game dataset utility functions.
 *
 * @java gameDistance.datasets.DatasetUtils
 * @author matthew.stephenson
 */
export class DatasetUtils {

	//-------------------------------------------------------------------------

	/**
	 * TODO currently the loaded trial doesn't consider rulesetStrings
	 * @java DatasetUtils.getSavedTrials(Game)
	 */
	public static getSavedTrials(game: GameLike): Trial[] {
		const gameTrials: Trial[] = [];
		const folderTrials = "/../Trials/TrialsRandom/";

		// In TS/Node, file access uses an escape hatch for the fs module.
		const fs = (globalThis as unknown as {
			fs?: {
				readdirSync(path: string): string[];
				existsSync(path: string): boolean;
			}
		}).fs;

		const gameName = game.name();
		const gameWithRuleset = game as unknown as { getRuleset(): { heading(): string } | null };
		const rulesetName = gameWithRuleset.getRuleset() === null ? "" : gameWithRuleset.getRuleset()!.heading();

		let trialFolderPath = folderTrials + gameName;
		if (rulesetName !== "")
			trialFolderPath += "/" + rulesetName.replace(/\//g, "_");

		if (!fs || !fs.existsSync(trialFolderPath)) {
			console.log("DO NOT FOUND IT - Path is " + trialFolderPath);
			return gameTrials;
		}

		const trialFiles = fs.readdirSync(trialFolderPath);
		const matchRecordModule = (globalThis as unknown as {
			MatchRecord?: {
				loadMatchRecordFromTextFile(file: string, game: GameLike): MatchRecord;
			}
		}).MatchRecord;

		for (const trialFile of trialFiles) {
			try {
				if (!matchRecordModule) break;
				const loadedRecord = matchRecordModule.loadMatchRecordFromTextFile(
					trialFolderPath + "/" + trialFile,
					game
				);
				const loadedTrial = (loadedRecord as unknown as { trial(): Trial }).trial();
				gameTrials.push(loadedTrial);
			} catch (e) {
				console.error(e);
			}
		}

		return gameTrials;
	}

	//-------------------------------------------------------------------------

}

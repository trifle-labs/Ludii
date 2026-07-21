// @java Mining/src/gameDistance/datasets/bagOfWords/ImportConceptDataset.java

import type { Dataset } from "../Dataset.js";
import type { GameLike, TreeLike } from "../../metrics/DistanceMetric.js";

/**
 * Dataset containing compilation concepts.
 * - BagOfWords
 *
 * @java gameDistance.datasets.bagOfWords.ImportConceptDataset
 * @author matthew.stephenson
 */
export class ImportConceptDataset implements Dataset {

	/**
	 * @java ImportConceptDataset.getBagOfWords(Game)
	 */
	public getBagOfWords(game: GameLike): Map<string, number> {
		const featureMap = new Map<string, number>();

		// Load files from a specific directory instead.
		const filePath = "../../LudiiPrivate/DataMiningScripts/Sklearn/res/Input/rulesetConceptsUCT.csv";

		let topRow: string[] = [];
		const records: string[][] = [];

		// In TS/Node, file access uses an escape hatch for the fs module.
		const fs = (globalThis as unknown as {
			fs?: { readFileSync(path: string, enc: string): string }
		}).fs;

		if (fs) {
			try {
				const content = fs.readFileSync(filePath, "utf8");
				const lines = content.split("\n");
				const firstLine = lines.shift();
				if (firstLine !== undefined)
					topRow = firstLine.split(",");
				for (const line of lines) {
					if (!line.trim()) continue;
					records.push(line.split(","));
				}
			} catch (e) {
				console.error(e);
			}
		}

		const gameWithRuleset = game as unknown as { getRuleset(): { heading(): string } | null };
		const gameName = game.name().replace(/[',()]/g, "").replace(/ /g, "_");
		let rulesetName = "Default";
		if (gameWithRuleset.getRuleset() !== null)
			rulesetName = gameWithRuleset.getRuleset()!.heading().replace(/[',()]/g, "").replace(/ /g, "_");
		const formattedRulesetName = gameName + "_" + rulesetName;

		// find the record that matches the ruleset name:
		for (const record of records) {
			if (record[0] === formattedRulesetName) {
				for (let i = 1; i < topRow.length; i++) {
					console.log(i);
					console.log(topRow[i]);
					console.log(Number(record[i]));
					featureMap.set(topRow[i] ?? "", Number(record[i]));
				}
				break;
			}
		}

		console.log("Failed to find match for " + formattedRulesetName);

		return featureMap;
	}

	/**
	 * Not Supported
	 * @java ImportConceptDataset.getSequence(Game)
	 */
	public getSequence(_game: GameLike): string[] {
		return null as unknown as string[];
	}

	/**
	 * Not Supported
	 * @java ImportConceptDataset.getTree(Game)
	 */
	public getTree(_game: GameLike): TreeLike {
		return null as unknown as TreeLike;
	}

}

// @java Mining/src/gameDistance/utils/DistanceUtils.java

import type { Dataset } from "../datasets/Dataset.js";
import type { GameLike } from "../metrics/DistanceMetric.js";

/**
 * Game distance utility functions.
 *
 * @java gameDistance.utils.DistanceUtils
 * @author matthew.stephenson
 */

// GameLoader is not yet ported for this context — escape hatch
type GameLoaderLike = {
	allAnalysisGameRulesetNames(): string[][];
	loadGameFromName(name: string, ruleset: string): GameLike;
};

export class DistanceUtils {

	// Alignment edit costs
	/** @java DistanceUtils.HIT_VALUE */
	public static readonly HIT_VALUE: number = 5;      // Should be positive
	/** @java DistanceUtils.MISS_VALUE */
	public static readonly MISS_VALUE: number = -5;    // Should be negative
	/** @java DistanceUtils.GAP_PENALTY */
	public static readonly GAP_PENALTY: number = -1;   // Should be negative

	/** @java DistanceUtils.nGramLength */
	public static readonly nGramLength: number = 4;

	// vocabulary store paths.
	/** @java DistanceUtils.vocabularyStorePath */
	private static readonly vocabularyStorePath: string = "res/gameDistance/vocabulary/";

	//-----------------------------------------------------------------------------

	/**
	 * @java DistanceUtils.fullVocabulary(Dataset, String, boolean)
	 */
	public static fullVocabulary(
		dataset: Dataset,
		datasetName: string,
		overrideStoredVocabularies: boolean
	): Map<string, number> {
		// In TS/Node, file-based serialisation is not available in the same way.
		// We skip file recovery/storage and always recompute.
		// (Java uses ObjectInputStream/ObjectOutputStream for binary serialisation.)

		// Calculate full Ludii game vocabulary.
		let numGames = 0.0;
		const vocabulary = new Map<string, number>();

		// GameLoader is not available in this context; use escape hatch.
		const gameLoader = (globalThis as unknown as { GameLoader?: GameLoaderLike }).GameLoader;
		const allNames: string[][] = gameLoader ? gameLoader.allAnalysisGameRulesetNames() : [];

		for (const gameRulesetName of allNames) {
			const game = gameLoader!.loadGameFromName(gameRulesetName[0] ?? "", gameRulesetName[1] ?? "");
			console.log(game.name());
			numGames++;
			for (const s of dataset.getBagOfWords(game).keys()) {
				const cur = vocabulary.get(s);
				if (cur !== undefined)
					vocabulary.set(s, cur + 1.0);
				else
					vocabulary.set(s, 1.0);
			}
		}
		for (const [key, val] of vocabulary.entries())
			vocabulary.set(key, Math.log(numGames / val));

		return vocabulary;
	}

	//-----------------------------------------------------------------------------

	/**
	 * @return CSN distance between two rulesetIds
	 * @java DistanceUtils.getRulesetCSNDistance(int, int, String)
	 */
	public static getRulesetCSNDistance(
		rulesetId1: number,
		rulesetId2: number,
		dataPath: string
	): number {
		return DistanceUtils.getAllRulesetCSNDistances(rulesetId1, dataPath).get(rulesetId2) ?? 0.0;
	}

	/**
	 * @return Map of rulesetId (key) to CSN distance (value) pairs.
	 * @java DistanceUtils.getAllRulesetCSNDistances(int, String)
	 */
	public static getAllRulesetCSNDistances(
		rulesetId: number,
		dataPath: string
	): Map<number, number> {
		const distancesFilePath = dataPath + "contextualiser_1000/similarity_" + rulesetId + ".csv";
		const rulesetCSNDistances = new Map<number, number>();

		// File reading not available in browser context — escape hatch:
		const fs = (globalThis as unknown as { fs?: { readFileSync(p: string, enc: string): string } }).fs;
		if (fs) {
			try {
				const content = fs.readFileSync(distancesFilePath, "utf8");
				const lines = content.split("\n");
				lines.shift(); // column names
				for (const line of lines) {
					if (!line.trim()) continue;
					const values = line.split(",");
					rulesetCSNDistances.set(parseInt(values[0] ?? "0"), parseFloat(values[1] ?? "0"));
				}
			} catch (e) {
				console.error(e);
			}
		}

		return rulesetCSNDistances;
	}

	//-----------------------------------------------------------------------------

	/**
	 * @return Geo distance between two rulesetIds
	 * @java DistanceUtils.getRulesetGeoDistance(int, int, String)
	 */
	public static getRulesetGeoDistance(
		rulesetId1: number,
		rulesetId2: number,
		dataPath: string
	): number {
		const geoSimilarities = DistanceUtils.getAllRulesetGeoDistances(rulesetId1, dataPath);
		const geoSimilarity = geoSimilarities.get(rulesetId2);
		return geoSimilarity !== undefined ? geoSimilarity : 0.0;
	}

	/**
	 * @return Map of rulesetId (key) to Geo distance (value) pairs.
	 * @java DistanceUtils.getAllRulesetGeoDistances(int, String)
	 */
	public static getAllRulesetGeoDistances(
		rulesetId: number,
		dataPath: string
	): Map<number, number> {
		const distancesFilePath = dataPath + "rulesetGeographicalDistances.csv";
		const rulesetGeoDistanceIds = new Map<number, number>();

		const fs = (globalThis as unknown as { fs?: { readFileSync(p: string, enc: string): string } }).fs;
		if (fs) {
			try {
				const content = fs.readFileSync(distancesFilePath, "utf8");
				const lines = content.split("\n");
				lines.shift(); // skip first line of column headers
				for (const line of lines) {
					if (!line.trim()) continue;
					const values = line.split(",");
					if (parseInt(values[0] ?? "0") !== rulesetId)
						continue;
					const similarity = Math.max((20000 - parseFloat(values[2] ?? "0")) / 20000, 0);
					rulesetGeoDistanceIds.set(parseInt(values[1] ?? "0"), similarity);
				}
			} catch (e) {
				console.log("Could not find similarity file, ruleset probably has no evidence.");
				console.error(e);
			}
		}

		return rulesetGeoDistanceIds;
	}

	//-----------------------------------------------------------------------------

	/**
	 * @java DistanceUtils.getGameDataset(Dataset, Game)
	 */
	public static getGameDataset(dataset: Dataset, game: GameLike): Map<string, number> {
		const datasetGame = new Map<string, number>(dataset.getBagOfWords(game));

		// Convert the raw frequency counts for datasetA into probability distributions.
		let valueSum = 0.0;
		for (const v of datasetGame.values())
			valueSum += v;
		for (const [k, v] of datasetGame.entries())
			datasetGame.set(k, v / valueSum);

		return datasetGame;
	}

	//-----------------------------------------------------------------------------

	/**
	 * @java DistanceUtils.defaultVocabulary(Dataset, Game, Game)
	 */
	public static defaultVocabulary(
		dataset: Dataset,
		gameA: GameLike,
		gameB: GameLike
	): Map<string, number> {
		const vocabulary = new Map<string, number>();

		const datasetA = DistanceUtils.getGameDataset(dataset, gameA);
		const datasetB = DistanceUtils.getGameDataset(dataset, gameB);

		for (const s of datasetA.keys())
			vocabulary.set(s, 1.0);
		for (const s of datasetB.keys())
			vocabulary.set(s, 1.0);

		return vocabulary;
	}

}

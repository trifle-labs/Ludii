// @java Mining/src/gameDistance/CompareAllDistanceMetrics.java

import { LudemeDataset } from "./datasets/treeEdit/LudemeDataset.js";
import { DistanceUtils } from "./utils/DistanceUtils.js";
import { Overlap } from "./metrics/bagOfWords/Overlap.js";
import { DatabaseInformation } from "../../../Common/src/main/DatabaseInformation.js";
import type { Dataset } from "./datasets/Dataset.js";
import type { DistanceMetric, GameLike } from "./metrics/DistanceMetric.js";

/**
 * Compares all distance metrics for a given set of games.
 *
 * Download the "TrialsRandom.zip" file from the Ludii Server.
 * Copy "TrialsRandom.zip" into "Ludii/Trials/", and extract the zip to a "TrialsRandom" folder
 * (just right click and select "Extract Here"). Making the fullPath "Ludii/Trials/TrialsRandom/".
 * Run CompareAllDistanceMetrics.java
 * Output for each game/ruleset is stored in Ludii/Mining/res/gameDistance/
 * "byGame" folder stores the distance from a specific ruleset to all other games for all metrics.
 * "byMetric" folder stores the distance between all ruleset pairs for a specific metric.
 *
 * Make sure to set the "overrideStoredVocabularies" variable to true if any trials or games have changed.
 *
 * @java gameDistance.CompareAllDistanceMetrics
 * @author matthew.stephenson
 */
export class CompareAllDistanceMetrics {

	/** Set this variable to true, if the stored vocabularies should be overwritten on the next comparison.
	 * @java CompareAllDistanceMetrics.overrideStoredVocabularies */
	static readonly overrideStoredVocabularies: boolean = true;

	//---------------------------------------------------------------------

	/** @java CompareAllDistanceMetrics.outputPath */
	static readonly outputPath: string = "res/gameDistance/";

	/** @java CompareAllDistanceMetrics.ludemeDataset */
	static readonly ludemeDataset: Dataset = new LudemeDataset();
//	static readonly compilationConceptDataset: Dataset = new CompilationConceptDataset();
//	static readonly moveConceptDataset: Dataset = new MoveConceptDataset();
//	static readonly importConceptDataset: Dataset = new ImportConceptDataset();

	/** @java CompareAllDistanceMetrics.fullLudemeVocabulary */
	static fullLudemeVocabulary: Map<string, number> = new Map();
//	static fullCompilationConceptVocabulary: Map<string, number> = new Map();
//	static fullMoveConceptVocabulary: Map<string, number> = new Map();
//	static fullImportConceptDataset: Map<string, number> = new Map();

	//---------------------------------------------------------------------

	/**
	 * @java CompareAllDistanceMetrics.main(String[])
	 */
	public static main(_args: string[]): void {
		CompareAllDistanceMetrics.calculateVocabularies();

		// Use this code to compare all games.
		// GameLoader.allAnalysisGameRulesetNames() — escape hatch
		const GameLoaderEx = (globalThis as unknown as {
			GameLoader?: { allAnalysisGameRulesetNames(): string[][] }
		}).GameLoader;
		const gamesAndRulesetsToCompare: string[][] = GameLoaderEx
			? GameLoaderEx.allAnalysisGameRulesetNames()
			: [];

		const allGameNames: string[] = [];
		const allRulesetNames: string[] = [];
		for (const allGamesToCompare of gamesAndRulesetsToCompare) {
			allGameNames.push(allGamesToCompare[0] ?? "");
			allRulesetNames.push(allGamesToCompare[1] ?? "");
		}
		CompareAllDistanceMetrics.recordAllComparisonDistances(allGameNames, allRulesetNames);
	}

	//---------------------------------------------------------------------

	/**
	 * Record distances for each game/ruleset comparison.
	 * @java CompareAllDistanceMetrics.recordAllComparisonDistances(String[], String[])
	 */
	private static recordAllComparisonDistances(gamesToCompare: string[], rulesetsToCompare: string[]): void {
		// [Game, {Game, {DistanceMetric, Value}}]
		const allGameDistances: Map<string, Map<string, number>>[] = [];

		const GameLoaderEx = (globalThis as unknown as {
			GameLoader?: { loadGameFromName(name: string, ruleset: string): GameLike }
		}).GameLoader;

		for (let i = 0; i < gamesToCompare.length; i++) {
			const gameDistances = new Map<string, Map<string, number>>();

			for (let j = 0; j < gamesToCompare.length; j++) {
				const gameA = GameLoaderEx
					? GameLoaderEx.loadGameFromName(gamesToCompare[i] ?? "", rulesetsToCompare[i] ?? "")
					: null as unknown as GameLike;
				const gameB = GameLoaderEx
					? GameLoaderEx.loadGameFromName(gamesToCompare[j] ?? "", rulesetsToCompare[j] ?? "")
					: null as unknown as GameLike;
				gameDistances.set(
					(gamesToCompare[j] ?? "") + "_" + (rulesetsToCompare[j] ?? ""),
					CompareAllDistanceMetrics.compareTwoGames(gameA, gameB)
				);
			}

			allGameDistances.push(gameDistances);
		}

		CompareAllDistanceMetrics.storeByGameResults(gamesToCompare, rulesetsToCompare, allGameDistances);
		CompareAllDistanceMetrics.storeByMetricResults(gamesToCompare, rulesetsToCompare, allGameDistances);
	}

	//---------------------------------------------------------------------

	/**
	 * Stores the distance results in a set of .csv files, with each file representing a single game
	 * and its distance to all other games.
	 * @java CompareAllDistanceMetrics.storeByGameResults(String[], String[], List)
	 */
	private static storeByGameResults(
		gamesToCompare: string[],
		rulesetsToCompare: string[],
		allGameDistances: Map<string, Map<string, number>>[]
	): void {
		// File I/O via escape hatch
		const fs = (globalThis as unknown as {
			fs?: {
				writeFileSync(path: string, content: string): void;
				mkdirSync(path: string, opts?: { recursive?: boolean }): void;
			}
		}).fs;

		for (let i = 0; i < gamesToCompare.length; i++) {
			const gameNameParts = (gamesToCompare[i] ?? "").split("/");
			const rulesetNameParts = (rulesetsToCompare[i] ?? "").split("/");
			const outputFilePath = CompareAllDistanceMetrics.outputPath + "output/byGame/" +
				(gameNameParts[gameNameParts.length - 1] ?? "") + "_" +
				(rulesetNameParts[rulesetNameParts.length - 1] ?? "") + ".csv";

			// Get distance names from first entry
			const gameDistEntry = allGameDistances[i];
			const firstEntry = gameDistEntry
				? (gameDistEntry.values().next().value as Map<string, number> | undefined)
				: undefined;
			const distanceNames: string[] = firstEntry ? Array.from(firstEntry.keys()) : [];

			// Write the top row of the csv
			let content = "GameName,Id";
			for (const distance of distanceNames)
				content += "," + distance;
			content += "\n";

			// Store all distances for this ruleset.
			for (const [gameName, distanceMap] of (gameDistEntry ?? new Map<string, Map<string, number>>()).entries()) {
				// Get corresponding ruleset Id.
				const nameArray = (gameName.split("_")[0] ?? "").split("/");
				const lastName = nameArray[nameArray.length - 1] ?? "";
				const formattedGameName = lastName.substring(0, lastName.length - 4);
				let formattedRulesetName = "";
				if (gameName.split("_").length > 1)
					formattedRulesetName = gameName.split("_")[1] ?? "";
				const rulesetId = DatabaseInformation.getRulesetId(formattedGameName, formattedRulesetName, "");

				const row = distanceNames.slice();
				for (const [distanceMetric, distanceValue] of distanceMap.entries()) {
					const idx = row.indexOf(distanceMetric);
					if (idx >= 0)
						row[idx] = String(distanceValue);
				}

				content += gameName + "," + rulesetId + "," + row.join(",") + "\n";
			}

			if (fs) {
				try {
					fs.mkdirSync(CompareAllDistanceMetrics.outputPath + "output/byGame/", { recursive: true });
					fs.writeFileSync(outputFilePath, content);
				} catch (e) {
					console.error(e);
				}
			}
		}
	}

	//---------------------------------------------------------------------

	/**
	 * Stores the distance results in a set of .csv files, with each file representing a single
	 * distance metric for all game-distance pairs.
	 * @java CompareAllDistanceMetrics.storeByMetricResults(String[], String[], List)
	 */
	private static storeByMetricResults(
		gamesToCompare: string[],
		rulesetsToCompare: string[],
		allGameDistances: Map<string, Map<string, number>>[]
	): void {
		const firstDistEntry = allGameDistances[0];
		const firstEntry = firstDistEntry
			? (firstDistEntry.values().next().value as Map<string, number> | undefined)
			: undefined;
		const distanceNames: string[] = firstEntry ? Array.from(firstEntry.keys()) : [];

		const fs = (globalThis as unknown as {
			fs?: {
				writeFileSync(path: string, content: string): void;
				mkdirSync(path: string, opts?: { recursive?: boolean }): void;
			}
		}).fs;

		for (let i = 0; i < distanceNames.length; i++) {
			const distanceName = distanceNames[i] ?? "";
			const outputFilePath = CompareAllDistanceMetrics.outputPath + "output/byMetric/" + distanceName + ".csv";

			const allRulesetIds: string[] = [];

			// Write the top row of the file
			let topRow = "Id";
			for (let j = 0; j < gamesToCompare.length; j++) {
				const gameName = (gamesToCompare[j] ?? "") + "_" + (rulesetsToCompare[j] ?? "");

				// Get corresponding ruleset Id.
				const nameArray = (gameName.split("_")[0] ?? "").split("/");
				const lastName = nameArray[nameArray.length - 1] ?? "";
				const formattedGameName = lastName.substring(0, lastName.length - 4);
				let formattedRulesetName = "";
				if (gameName.split("_").length > 1)
					formattedRulesetName = gameName.split("_")[1] ?? "";
				const rulesetId = DatabaseInformation.getRulesetId(formattedGameName, formattedRulesetName, "");
				allRulesetIds.push(String(rulesetId));

				topRow += "," + rulesetId;
			}

			let content = topRow + "\n";

			for (let j = 0; j < gamesToCompare.length; j++) {
				let row = allRulesetIds[j] ?? "";

				const distanceMapAllGames = allGameDistances[j];

				for (let k = 0; k < gamesToCompare.length; k++) {
					const key = (gamesToCompare[k] ?? "") + "_" + (rulesetsToCompare[k] ?? "");
					const distanceMap = distanceMapAllGames?.get(key);
					row += "," + (distanceMap?.get(distanceName) ?? "");
				}

				content += row + "\n";
			}

			if (fs) {
				try {
					fs.mkdirSync(CompareAllDistanceMetrics.outputPath + "output/byMetric/", { recursive: true });
					fs.writeFileSync(outputFilePath, content);
				} catch (e) {
					console.error(e);
				}
			}
		}
	}

	//---------------------------------------------------------------------

	/**
	 * Calculate dataset vocabularies for TFIDF measures.
	 * @java CompareAllDistanceMetrics.calculateVocabularies()
	 */
	private static calculateVocabularies(): void {
		CompareAllDistanceMetrics.fullLudemeVocabulary = DistanceUtils.fullVocabulary(
			CompareAllDistanceMetrics.ludemeDataset,
			"ludemeDataset",
			CompareAllDistanceMetrics.overrideStoredVocabularies
		);
		console.log("ludemeVocabulary recorded");

//		CompareAllDistanceMetrics.fullCompilationConceptVocabulary = DistanceUtils.fullVocabulary(compilationConceptDataset, "compilationConceptDataset", overrideStoredVocabularies);
//		console.log("compilationConceptDataset recorded");
//
//		CompareAllDistanceMetrics.fullMoveConceptVocabulary = DistanceUtils.fullVocabulary(moveConceptDataset, "moveConceptDataset", overrideStoredVocabularies);
//		console.log("moveConceptVocabulary recorded");
//
//		CompareAllDistanceMetrics.fullImportConceptDataset = DistanceUtils.fullVocabulary(importConceptDataset, "importConceptDataset", overrideStoredVocabularies);
//		console.log("importConceptVocabulary recorded");
	}

	//---------------------------------------------------------------------

	/**
	 * Compares gameA and gameB across all distance measures
	 * @param gameA
	 * @param gameB
	 * @return Map of distance metric names and values.
	 * @java CompareAllDistanceMetrics.compareTwoGames(Game, Game)
	 */
	public static compareTwoGames(gameA: GameLike, gameB: GameLike): Map<string, number> {
		const allDistances = new Map<string, number>();

		console.log("\n" + gameA.name() + " v.s. " + gameB.name());

		const defaultLudemeVocabulary = DistanceUtils.defaultVocabulary(
			CompareAllDistanceMetrics.ludemeDataset,
			gameA,
			gameB
		);

		//---------------------------------------------------------------------
		// Overlap

		const overlapDistanceMetric: DistanceMetric = new Overlap();

		allDistances.set(
			"overlap_ludeme",
			overlapDistanceMetric.distance(CompareAllDistanceMetrics.ludemeDataset, defaultLudemeVocabulary, gameA, gameB)
		);

//		//---------------------------------------------------------------------
//		// JensenShannonDivergence
//		const jensenShannonDivergenceMetric: DistanceMetric = new JensenShannonDivergence();
//		allDistances.set("JSD_ludeme", jensenShannonDivergenceMetric.distance(ludemeDataset, defaultLudemeVocabulary, gameA, gameB));
//		...
//
//		//---------------------------------------------------------------------
//		// Cosine
//		const cosineMetric: DistanceMetric = new Cosine();
//		allDistances.set("Cosine_ludeme", cosineMetric.distance(ludemeDataset, defaultLudemeVocabulary, gameA, gameB));
//		...
//
//		//---------------------------------------------------------------------
//		// Jaccard
//		const jaccardMetric: DistanceMetric = new Jaccard();
//		allDistances.set("Jaccard_ludeme", jaccardMetric.distance(ludemeDataset, defaultLudemeVocabulary, gameA, gameB));
//		...
//
//		//---------------------------------------------------------------------
//		// Levenshtein
//		// const levenshteinMetric: DistanceMetric = new Levenshtein();
//		// allDistances.set("Levenshtein_ludeme", levenshteinMetric.distance(ludemeDataset, null, gameA, gameB));
//
//		//---------------------------------------------------------------------
//		// Local Alignment
//		// const localAlignmentMetric: DistanceMetric = new LocalAlignment();
//		// allDistances.set("LocalAlignment_ludeme", localAlignmentMetric.distance(ludemeDataset, null, gameA, gameB));
//
//		//---------------------------------------------------------------------
//		// Repeated Local Alignment
//		// const repeatedLocalAlignmentMetric: DistanceMetric = new RepeatedLocalAlignment();
//		// allDistances.set("RepeatedLocalAlignment_ludeme", repeatedLocalAlignmentMetric.distance(ludemeDataset, null, gameA, gameB));
//
//		//---------------------------------------------------------------------
//		// Global Alignment
//		// const globalAlignmentMetric: DistanceMetric = new GlobalAlignment();
//		// allDistances.set("GlobalAlignment_ludeme", globalAlignmentMetric.distance(ludemeDataset, null, gameA, gameB));
//
//		//---------------------------------------------------------------------
//		// Zhang Shasha
//		// const zhangShashaMetric: DistanceMetric = new ZhangShasha();
//		// allDistances.set("ZhangShasha_ludeme", zhangShashaMetric.distance(ludemeDataset, defaultLudemeVocabulary, gameA, gameB));
//
//		//---------------------------------------------------------------------
//		// Apted
//		// const aptedMetric: DistanceMetric = new Apted();
//		// allDistances.set("Apted_ludeme", aptedMetric.distance(ludemeDataset, defaultLudemeVocabulary, gameA, gameB));

		//---------------------------------------------------------------------

		return allDistances;
	}

	//---------------------------------------------------------------------

}

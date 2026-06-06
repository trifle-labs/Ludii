// @java Mining/src/ludemeplexDetection/DatabaseFunctions.java

import * as fs from "fs";
import { LudemeInfo } from "../../../Common/src/main/grammar/LudemeInfo.js";
import { Call } from "../../../Common/src/main/grammar/Call.js";
import { GameLoader, type IGame } from "../../../../ludemes/other/GameLoader.js";
import { GetLudemeInfo } from "./GetLudemeInfo.js";

/**
 * Provides functions for reading/saving DB information from/to external CSV files.
 *
 * @java ludemeplexDetection.DatabaseFunctions
 * @author matthew.stephenson
 */
export class DatabaseFunctions {

	//-------------------------------------------------------------------------

	// Output
	/** @java DatabaseFunctions.ludemesOutputFilePath */
	private static readonly ludemesOutputFilePath = "./res/ludemeplexDetection/output/ludemes.csv";
	/** @java DatabaseFunctions.ludemeplexesOutputFilePath */
	private static readonly ludemeplexesOutputFilePath = "./res/ludemeplexDetection/output/ludemeplexes.csv";
	/** @java DatabaseFunctions.defineLudemeplexesOutputFilePath */
	private static readonly defineLudemeplexesOutputFilePath = "./res/ludemeplexDetection/output/defineLudemeplexes.csv";
	/** @java DatabaseFunctions.rulesetLudemeplexesOutputFilePath */
	private static readonly rulesetLudemeplexesOutputFilePath = "./res/ludemeplexDetection/output/rulesetLudemeplexes.csv";
	/** @java DatabaseFunctions.defineRulesetludemeplexesOutputFilePath */
	private static readonly defineRulesetludemeplexesOutputFilePath = "./res/ludemeplexDetection/output/rulesetDefineLudemeplexes.csv";
	/** @java DatabaseFunctions.ludemeplexesLudemesOutputFilePath */
	private static readonly ludemeplexesLudemesOutputFilePath = "./res/ludemeplexDetection/output/ludemeplexLudemes.csv";
	/** @java DatabaseFunctions.rulesetLudemesOutputFilePath */
	private static readonly rulesetLudemesOutputFilePath = "./res/ludemeplexDetection/output/rulesetLudemes.csv";
	/** @java DatabaseFunctions.notFoundLudemesFilePath */
	private static readonly notFoundLudemesFilePath = "./res/ludemeplexDetection/output/NOTFOUNDLUDEMES.csv";

	//-------------------------------------------------------------------------

	/**
	 * Saves all relevant information about the set of identified ludemeplexes, in an output csv.
	 * @java DatabaseFunctions.storeLudemeplexInfo(Map, Map)
	 */
	public static storeLudemeplexInfo(
		allLudemeplexes: Map<Call, Set<string>>,
		allludemeplexescount: Map<Call, number>
	): void {
		try {
			let output = "";
			let ludemeplexId = 1;

			for (const [call, gameNames] of allLudemeplexes.entries()) {
				let outputLine = ludemeplexId + ",";

				const ludemeplexStringList: string[] = call.ludemeFormat(0);
				const ludemeplexString = ludemeplexStringList.join("");

				// Try to compile ludemeplex
				try {
					const compiler = (globalThis as unknown as { compiler?: { compileObject: (s: string, cls: string, report: unknown) => unknown } }).compiler;
					if (compiler) {
						const clsName = (call.cls() as unknown as { getName: () => string }).getName();
						const compiledObject = compiler.compileObject(ludemeplexString, clsName, {});
						if (compiledObject === null || compiledObject === undefined) {
							throw new Error("compile returned null");
						}
					}
				} catch (E) {
					console.log("Game " + JSON.stringify([...gameNames]));
					console.error("ERROR Failed to compile " + ludemeplexString);
					const clsName = (call.cls() as unknown as { getName: () => string }).getName();
					console.error("ERROR symbolName = " + clsName);
					console.error("ERROR className = " + clsName);
				}

				let defineLudemeplexString = ludemeplexString.trim();
				defineLudemeplexString = "(define \"DLP.Ludemeplexes." + ludemeplexId + "\" " + defineLudemeplexString + ")";

				// Replace all quotes with double quotes for database importing
				defineLudemeplexString = defineLudemeplexString.replaceAll('"', '""');

				outputLine += '"' + defineLudemeplexString + '"';           // define version in .lud format
				outputLine += "," + (allludemeplexescount.get(call) ?? 0); // total count
				outputLine += "," + gameNames.size;                         // # rulesets
				outputLine += "\n";
				ludemeplexId++;

				output += outputLine;
			}

			fs.writeFileSync(DatabaseFunctions.ludemeplexesOutputFilePath, output, "utf8");
		} catch (e) {
			console.error(e);
		}
	}

	//-------------------------------------------------------------------------

	/**
	 * Records all Define Ludemeplexes (ludemeplexes with a # in them).
	 * NOTE This loops over everything twice, so could be optimised more.
	 * @java DatabaseFunctions.storeDefineLudemeplexInfo(Map, Map, int)
	 */
	public static storeDefineLudemeplexInfo(
		allLudemeplexes: Map<Call, Set<string>>,
		allLudemeplexescount: Map<Call, number>,
		maxNumDifferences: number
	): Map<string, Set<string>> {
		// Map of all ludemeplexes (lud format) and the games they are in.
		const allDefineLudemeplexes = new Map<string, Set<string>>();
		// Map of all ludemeplexes (lud format) and the original Ludemeplexes that they relate to.
		const allDefineLudemeplexesOriginalLudemeplexes = new Map<string, Set<Call>>();

		// Record all Define ludemeplexes
		let counter1 = 1;
		for (const [ludemeplexEntryKey, ludemeplexEntryValue] of allLudemeplexes.entries()) {
			console.log("" + counter1 + " / " + allLudemeplexes.size);
			counter1++;

			const ludemeplexStringList: string[] = ludemeplexEntryKey.ludemeFormat(0);

			let counter2 = 1;
			for (const [entryKey, entryValue] of allLudemeplexes.entries()) {
				// Skip any pairs of ludemeplexes that have already been compared.
				counter2++;
				if (counter1 > counter2)
					continue;

				const storedLudemeplexStringList: string[] = entryKey.ludemeFormat(0);

				if (storedLudemeplexStringList.length !== ludemeplexStringList.length)
					continue;

				const newDefineLudemeplexStringList: string[] = [];
				let numDifferences = 0;

				for (let i = 0; i < ludemeplexStringList.length; i++) {
					const lStr = ludemeplexStringList[i]!;
					const sStr = storedLudemeplexStringList[i]!;

					if (
						lStr.replaceAll(/[(){}]/g, "").trim().length === 0
						&& sStr.replaceAll(/[(){}]/g, "").trim().length === 0
						&& lStr !== sStr
					) {
						numDifferences = maxNumDifferences + 1;
						break;
					}

					if (lStr !== sStr) {
						if (i === 1) {
							numDifferences = maxNumDifferences + 1;
							break;
						}

						numDifferences++;
						newDefineLudemeplexStringList.push("#" + numDifferences + " ");
					} else {
						newDefineLudemeplexStringList.push(lStr);
					}

					if (numDifferences > maxNumDifferences)
						break;
				}

				if (numDifferences <= maxNumDifferences && numDifferences > 0) {
					const newDefineString = newDefineLudemeplexStringList.join("");

					// Store the games that use this define ludemeplex.
					const newSetOfGames: Set<string> = new Set<string>();
					if (allDefineLudemeplexes.has(newDefineString)) {
						for (const g of allDefineLudemeplexes.get(newDefineString)!) {
							newSetOfGames.add(g);
						}
					}
					for (const g of entryValue) { newSetOfGames.add(g); }
					for (const g of ludemeplexEntryValue) { newSetOfGames.add(g); }
					allDefineLudemeplexes.set(newDefineString, newSetOfGames);

					// Store all ludemeplexes that are associated with each define ludemeplex.
					const ludemeplexesThisDefineUses: Set<Call> = new Set<Call>();
					if (allDefineLudemeplexesOriginalLudemeplexes.has(newDefineString)) {
						for (const c of allDefineLudemeplexesOriginalLudemeplexes.get(newDefineString)!) {
							ludemeplexesThisDefineUses.add(c);
						}
					}
					ludemeplexesThisDefineUses.add(entryKey);
					ludemeplexesThisDefineUses.add(ludemeplexEntryKey);
					allDefineLudemeplexesOriginalLudemeplexes.set(newDefineString, ludemeplexesThisDefineUses);
				}
			}
		}

		// Write them to output file
		try {
			let output = "";
			let ludemeplexId = 1;

			for (const [key, gameNames] of allDefineLudemeplexes.entries()) {
				let outputLine = ludemeplexId + ",";

				let defineLudemeplexString = key.trim();
				defineLudemeplexString = "(define \"DLP.Ludemeplexes." + ludemeplexId + "\" " + defineLudemeplexString + ")";

				// Replace all quotes with double quotes for database importing
				defineLudemeplexString = defineLudemeplexString.replaceAll('"', '""');

				let totalCount = 0;
				const origLudemeplexes = allDefineLudemeplexesOriginalLudemeplexes.get(key)!;
				for (const c of origLudemeplexes) {
					totalCount += allLudemeplexescount.get(c) ?? 0;
				}

				outputLine += '"' + defineLudemeplexString + '"';
				outputLine += "," + totalCount;         // total count
				outputLine += "," + gameNames.size;     // # rulesets
				outputLine += "\n";
				ludemeplexId++;

				output += outputLine;
			}

			fs.writeFileSync(DatabaseFunctions.defineLudemeplexesOutputFilePath, output, "utf8");
		} catch (e) {
			console.error(e);
		}

		return allDefineLudemeplexes;
	}

	//-------------------------------------------------------------------------

	/**
	 * Saves all relevant information about the set of identified ludemes in an output csv.
	 * @java DatabaseFunctions.storeLudemeInfo()
	 */
	public static storeLudemeInfo(): void {
		try {
			let output = "";
			for (const ludeme of GetLudemeInfo.getLudemeInfo()) {
				output += ludeme.id() + "," + (ludeme as unknown as { getDBString: () => string }).getDBString() + "\n";
			}
			fs.writeFileSync(DatabaseFunctions.ludemesOutputFilePath, output, "utf8");
		} catch (e1) {
			console.error(e1);
		}
	}

	//-------------------------------------------------------------------------

	/**
	 * Saves all LudemeplexID-RulesetID pairs, in an output csv.
	 * @java DatabaseFunctions.storeLudemeplexRulesetPairs(Map)
	 */
	public static storeLudemeplexRulesetPairs(allLudemeplexes: Map<Call, Set<string>>): void {
		let IdCounter = 1;
		let ludemeplexId = 1;

		// DBGameInfo is not yet ported; use escape hatch
		const DBGameInfo = (globalThis as unknown as { DBGameInfo?: { getRulesetIds: () => Map<string, number>; getUniqueName: (game: IGame) => string } }).DBGameInfo;

		try {
			let output = "";
			for (const [, gameNames] of allLudemeplexes.entries()) {
				// Store the ID of all rulesets that use this ludemeplex
				for (const name of gameNames) {
					if (DBGameInfo && DBGameInfo.getRulesetIds().has(name)) {
						output += IdCounter + "," + DBGameInfo.getRulesetIds().get(name) + "," + ludemeplexId + "\n";
						IdCounter++;
					} else {
						console.log("could not find game name_1: " + name);
					}
				}
				ludemeplexId++;
			}
			fs.writeFileSync(DatabaseFunctions.rulesetLudemeplexesOutputFilePath, output, "utf8");
		} catch (e) {
			console.error(e);
		}
	}

	//-------------------------------------------------------------------------

	/**
	 * Saves all Define LudemeplexID-RulesetID pairs, in an output csv.
	 * @java DatabaseFunctions.storeDefineLudemeplexRulesetPairs(Map)
	 */
	public static storeDefineLudemeplexRulesetPairs(allDefineLudemeplexes: Map<string, Set<string>>): void {
		let IdCounter = 1;
		let defineLudemeplexId = 1;

		// DBGameInfo is not yet ported; use escape hatch
		const DBGameInfo = (globalThis as unknown as { DBGameInfo?: { getRulesetIds: () => Map<string, number> } }).DBGameInfo;

		try {
			let output = "";
			for (const [, gameNames] of allDefineLudemeplexes.entries()) {
				// Store the ID of all rulesets that use this ludemeplex
				for (const name of gameNames) {
					if (DBGameInfo && DBGameInfo.getRulesetIds().has(name)) {
						output += IdCounter + "," + DBGameInfo.getRulesetIds().get(name) + "," + defineLudemeplexId + "\n";
						IdCounter++;
					} else {
						console.log("could not find game name_2: " + name);
					}
				}
				defineLudemeplexId++;
			}
			fs.writeFileSync(DatabaseFunctions.defineRulesetludemeplexesOutputFilePath, output, "utf8");
		} catch (e) {
			console.error(e);
		}
	}

	//-------------------------------------------------------------------------

	/**
	 * Saves all LudemeplexID-LudemeID pairs, in an output csv.
	 * @java DatabaseFunctions.storeLudemesInLudemeplex(Map)
	 */
	public static storeLudemesInLudemeplex(allLudemeplexes: Map<Call, Set<string>>): void {
		// All ludeme strings found within at least one call tree (testing purposes)
		const allFoundLudemes = new Set<LudemeInfo>();

		let IdCounter = 1;
		let ludemeplexId = 1;

		try {
			let output = "";
			for (const [call] of allLudemeplexes.entries()) {
				// Get all ludemes in this ludemeplex
				const ludemesInLudemeplex: Map<LudemeInfo, number> = call.analysisFormat(0, GetLudemeInfo.getLudemeInfo());
				ludemesInLudemeplex.delete(null as unknown as LudemeInfo);

				for (const [ludeme] of ludemesInLudemeplex.entries()) {
					if (GetLudemeInfo.getLudemeInfo().includes(ludeme)) {
						allFoundLudemes.add(ludeme);
						output += IdCounter + "," + ludemeplexId + "," + ludeme.id() + "\n";
						IdCounter++;
					} else {
						console.log("could not find ludeme: " + ludeme);
					}
				}
				ludemeplexId++;
			}
			fs.writeFileSync(DatabaseFunctions.ludemeplexesLudemesOutputFilePath, output, "utf8");
		} catch (e) {
			console.error(e);
		}
	}

	//-------------------------------------------------------------------------

	/**
	 * @java DatabaseFunctions.storeLudemesInGames(List, List)
	 */
	public static storeLudemesInGames(
		allValidLudemes: LudemeInfo[],
		gameRulesetNames: string[][]
	): void {
		let IdCounter = 1;
		const allLudemesfound = new Set<LudemeInfo>();

		// DBGameInfo is not yet ported; use escape hatch
		const DBGameInfo = (globalThis as unknown as { DBGameInfo?: { getRulesetIds: () => Map<string, number>; getUniqueName: (game: IGame) => string } }).DBGameInfo;

		try {
			let output = "";
			for (const gameRulesetName of gameRulesetNames) {
				const game = GameLoader.loadGameFromName(gameRulesetName[0]!, gameRulesetName[1]!);
				const name = DBGameInfo ? DBGameInfo.getUniqueName(game) : "";

				const ludemesInGame: Map<LudemeInfo, number> = (
					(game as unknown as { description: () => { callTree: () => Call } })
						.description().callTree()
				).analysisFormat(0, allValidLudemes);

				for (const [ludeme, count] of ludemesInGame.entries()) {
					allLudemesfound.add(ludeme);
					if (DBGameInfo && DBGameInfo.getRulesetIds().has(name)) {
						output += IdCounter + "," + DBGameInfo.getRulesetIds().get(name) + "," + ludeme.id() + "," + count + "\n";
						IdCounter++;
					} else {
						console.log("could not find game name_3: " + name);
					}
				}
			}
			fs.writeFileSync(DatabaseFunctions.rulesetLudemesOutputFilePath, output, "utf8");
		} catch (e) {
			console.error(e);
		}

		// Record all ludemes that weren't found in any game.
		let notFoundLudemesString = "";
		for (const ludeme of allValidLudemes) {
			if (!allLudemesfound.has(ludeme)) {
				notFoundLudemesString += (ludeme as unknown as { getDBString: () => string }).getDBString() + "\n";
			}
		}
		try {
			fs.writeFileSync(DatabaseFunctions.notFoundLudemesFilePath, notFoundLudemesString, "utf8");
		} catch (e) {
			console.error(e);
		}
	}

	//-------------------------------------------------------------------------

}

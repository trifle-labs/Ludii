// @java Mining/src/ludemeplexDetection/LudemeplexDetection.java

import { Call } from "../../../Common/src/main/grammar/Call.js";
import { StringRoutines } from "../../../Common/src/main/StringRoutines.js";
import { GameLoader } from "../../../../ludemes/other/GameLoader.js";
import { DatabaseFunctions } from "./DatabaseFunctions.js";
import { GetLudemeInfo } from "./GetLudemeInfo.js";

/**
 * Detects all ludemes and ludemeplexes within all games in Ludii.
 *
 * The database csv tables will be created in "Mining/res/ludemeplexDetection/output"
 * Import all of these (except for "NOTFOUNDLUDEMES.csv") to the Ludii database.
 *
 * Make sure the file located at "Ludii/Mining/res/concepts/input/GameRulesets.csv" is up to date.
 * You can run the SQL command inside the "SQL_command.txt" file on the Ludii database to export the required file.
 *
 * @java ludemeplexDetection.LudemeplexDetection
 * @author matthew.stephenson
 */
export class LudemeplexDetection {

	/** @java LudemeplexDetection.DETECTLUDEMEPLEXES */
	static readonly DETECTLUDEMEPLEXES: boolean = false;   // Set to true to also detect ludemeplexes (slow)
	/** @java LudemeplexDetection.MINLUDMEPLEXSIZE */
	static readonly MINLUDMEPLEXSIZE: number = 4;           // Minimum number of ludemes inside a ludemeplex
	/** @java LudemeplexDetection.MAXLUDEMEPLEXSIZE */
	static readonly MAXLUDEMEPLEXSIZE: number = 6;          // Maximum number of ludemes inside a ludemeplex
	/** @java LudemeplexDetection.MAXDEFINELUDEMEPLEXDIFFERENCE */
	static readonly MAXDEFINELUDEMEPLEXDIFFERENCE: number = 2; // Maximum number of # symbols inside define ludemeplexes

	//-------------------------------------------------------------------------
	// Stored results

	/** Map of all ludemeplexes and the games they are in. @java LudemeplexDetection.allLudemeplexes */
	static readonly allLudemeplexes = new Map<Call, Set<string>>();

	/** Map of all ludemeplexes and the number of times they occur across all games. @java LudemeplexDetection.allLudemeplexesCount */
	static readonly allLudemeplexesCount = new Map<Call, number>();

	//-------------------------------------------------------------------------

	/**
	 * Records all ludemeplexes for a given Game.
	 * @java LudemeplexDetection.recordLudemeplexesInGame(Game)
	 */
	private static recordLudemeplexesInGame(game: unknown): void {
		const callTree: Call = (game as unknown as { description: () => { callTree: () => Call } }).description().callTree();
		// DBGameInfo is not yet ported; use escape hatch
		const DBGameInfo = (globalThis as unknown as { DBGameInfo?: { getUniqueName: (game: unknown) => string } }).DBGameInfo;
		const gameName: string = DBGameInfo ? DBGameInfo.getUniqueName(game) : String(game);
		console.log(gameName);

		// Convert callTree for the game into a list tokens, with unique Ids for each token.
		LudemeplexDetection.storeludemeplexes(callTree, gameName);
	}

	//-------------------------------------------------------------------------

	/**
	 * Stores all ludemeplexes found within a Call object, for an associated game name.
	 * @java LudemeplexDetection.storeludemeplexes(Call, String)
	 */
	private static storeludemeplexes(c: Call, gameName: string): void {
		// Count the number of ludemes used in the ludemeplex.
		const ludemeList = StringRoutines.join("", c.ludemeFormat(0));
		const ludemeCount = ludemeList.split(" ").length;

		// Don't store arrays.
		const cStr = c.toString();
		if (cStr.charAt(0) !== '{' && ludemeCount >= LudemeplexDetection.MINLUDMEPLEXSIZE && ludemeCount <= LudemeplexDetection.MAXLUDEMEPLEXSIZE) {
			let gameNameArray: Set<string> = new Set<string>();
			if (LudemeplexDetection.allLudemeplexes.has(c))
				gameNameArray = LudemeplexDetection.allLudemeplexes.get(c)!;

			gameNameArray.add(gameName);
			LudemeplexDetection.allLudemeplexes.set(c, gameNameArray);

			let count: number = 0;
			if (LudemeplexDetection.allLudemeplexesCount.has(c))
				count = LudemeplexDetection.allLudemeplexesCount.get(c)!;
			count = (count + 1);
			LudemeplexDetection.allLudemeplexesCount.set(c, count);
		}

		for (const arg of c.args()) {
			if (arg.args().length > 0)
				LudemeplexDetection.storeludemeplexes(arg, gameName);
		}
	}

	//-------------------------------------------------------------------------

	/**
	 * Returns the count for every ludemeplex in a call object.
	 * NOTE: DO NOT KILL: May be used in future.
	 * @java LudemeplexDetection.countLudemeplexes(Call, Map)
	 */
	// @SuppressWarnings("unused")
	private static countLudemeplexes(c: Call, currentCount: Map<Call, number>): Map<Call, number> {
		if (currentCount.has(c))
			currentCount.set(c, currentCount.get(c)! + 1);
		else
			currentCount.set(c, 1);

		for (const arg of c.args()) {
			if (arg.args().length > 0)
				LudemeplexDetection.countLudemeplexes(arg, currentCount);
		}

		return currentCount;
	}

	//-------------------------------------------------------------------------

	/**
	 * Predicts the win-rate for a variety of games, AI agents and prediction algorithms.
	 * @java LudemeplexDetection.main(String[])
	 */
	public static main(_args: string[]): void {
		// All rulesets to be analysed.
		const chosenGames: string[][] = GameLoader.allAnalysisGameRulesetNames();

		console.log("//-------------------------------------------------------------------------");

		// Record ludemes across all rulesets.
		DatabaseFunctions.storeLudemeInfo();
		DatabaseFunctions.storeLudemesInGames(GetLudemeInfo.getLudemeInfo(), chosenGames);
		console.log("Ludemes Recorded");

		console.log("//-------------------------------------------------------------------------");

		if (LudemeplexDetection.DETECTLUDEMEPLEXES) {
			// Record ludemeplexes across all rulesets.
			for (const gameRulesetName of chosenGames)
				LudemeplexDetection.recordLudemeplexesInGame(GameLoader.loadGameFromName(gameRulesetName[0]!, gameRulesetName[1]!));
			DatabaseFunctions.storeLudemeplexInfo(LudemeplexDetection.allLudemeplexes, LudemeplexDetection.allLudemeplexesCount);
			DatabaseFunctions.storeLudemesInLudemeplex(LudemeplexDetection.allLudemeplexes);
			DatabaseFunctions.storeLudemeplexRulesetPairs(LudemeplexDetection.allLudemeplexes);
			console.log("Ludemeplexes Recorded");

			console.log("//-------------------------------------------------------------------------");

			// Record possible define ludemeplexes.
			const allDefineLudemeplexes: Map<string, Set<string>> = DatabaseFunctions.storeDefineLudemeplexInfo(
				LudemeplexDetection.allLudemeplexes,
				LudemeplexDetection.allLudemeplexesCount,
				LudemeplexDetection.MAXDEFINELUDEMEPLEXDIFFERENCE
			);
			DatabaseFunctions.storeDefineLudemeplexRulesetPairs(allDefineLudemeplexes);
			console.log("Define Ruleset Ludemeplexes Recorded");

			console.log("//-------------------------------------------------------------------------");
		}
	}

	//-------------------------------------------------------------------------

}

// Suppress unused warning for countLudemeplexes — kept for future use like Java
void (LudemeplexDetection as unknown as { countLudemeplexes: unknown }).countLudemeplexes;

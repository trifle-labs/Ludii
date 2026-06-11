// @java Mining/src/utils/heuristics/GenerateBaseHeuristicScoresDatabaseCSVs.java

import { fs } from "../../../../node-shim/fs-lazy.js";
import { path } from "../../../../node-shim/fs-lazy.js";
import { GameLoader } from "../../../../../ludemes/other/GameLoader.js";
import { FileHandling } from "../../../../Common/src/main/FileHandling.js";
import { StringRoutines } from "../../../../Common/src/main/StringRoutines.js";
import { CommandLineArgParse } from "../../../../Common/src/main/CommandLineArgParse.js";

// IdRuleset is not yet ported; use escape hatch
type IIdRuleset = { get: (game: unknown) => number };
const IdRuleset = (globalThis as unknown as { IdRuleset?: IIdRuleset }).IdRuleset;

/**
 * Generates CSV files for database, describing scores of all base heuristics
 * for all games.
 *
 * @java utils.heuristics.GenerateBaseHeuristicScoresDatabaseCSVs
 * @author Dennis Soemers
 */
export class GenerateBaseHeuristicScoresDatabaseCSVs {

	//-------------------------------------------------------------------------

	/**
	 * Different types of heuristics for which we store data.
	 * @java GenerateBaseHeuristicScoresDatabaseCSVs.HeuristicTypes
	 */
	public static readonly HeuristicTypes = {
		/** A standard, unparameterised heuristic */
		Standard: "Standard",
		/** A parameterised heuristic with a specific parameter */
		Unmerged: "Unmerged",
		/** Represents a collection of heuristics of the same type, but with different parameters */
		Merged: "Merged",
	} as const;

	//-------------------------------------------------------------------------

	/**
	 * Constructor (don't need this).
	 * @java GenerateBaseHeuristicScoresDatabaseCSVs()
	 */
	private constructor() {
		// Do nothing
	}

	//-------------------------------------------------------------------------

	/**
	 * Generates our CSV.
	 * @java GenerateBaseHeuristicScoresDatabaseCSVs.generateCSVs(CommandLineArgParse)
	 */
	private static generateCSVs(argParse: CommandLineArgParse): void {
		let resultsDir: string = argParse.getValueString("--results-dir");
		resultsDir = resultsDir.replaceAll("\\", "/");
		if (!resultsDir.endsWith("/"))
			resultsDir += "/";

		const allGameNames: string[] = FileHandling.listGames().filter((s: string) => (
			!(s.replaceAll("\\", "/").includes("/lud/bad/")) &&
			!(s.replaceAll("\\", "/").includes("/lud/wip/")) &&
			!(s.replaceAll("\\", "/").includes("/lud/WishlistDLP/")) &&
			!(s.replaceAll("\\", "/").includes("/lud/test/")) &&
			!(s.replaceAll("\\", "/").includes("/lud/wishlist/")) &&
			!(s.replaceAll("\\", "/").includes("/lud/reconstruction/")) &&
			!(s.replaceAll("\\", "/").includes("/lud/simulation/")) &&
			!(s.replaceAll("\\", "/").includes("/lud/proprietary/"))
		));

		const heuristicsList: HeuristicData[] = [];
		const scoreDataList: ScoreData[] = [];

		for (const fullGamePath of allGameNames) {
			const gamePathParts = fullGamePath.replaceAll("\\", "/").split("/");
			const gameName = gamePathParts[gamePathParts.length - 1]!.replaceAll(".lud", "");
			const gameNoRuleset = GameLoader.loadGameFromName(gameName + ".lud");
			const gameRulesets = [...(gameNoRuleset.description().rulesets() ?? []), null];
			let foundRealRuleset = false;

			for (const ruleset of gameRulesets) {
				let fullRulesetName = "";
				let game;

				if (ruleset === null && foundRealRuleset) {
					// Skip this, don't allow game without ruleset if we do have real implemented ones
					continue;
				} else if (ruleset !== null && ruleset.optionSettings().length > 0) {
					fullRulesetName = ruleset.heading();
					foundRealRuleset = true;
					game = GameLoader.loadGameFromName(gameName + ".lud", fullRulesetName);
				} else if (ruleset !== null && ruleset.optionSettings().length === 0) {
					// Skip empty ruleset
					continue;
				} else {
					game = gameNoRuleset;
				}

				const gameExt = game as unknown as {
					isDeductionPuzzle: () => boolean;
					isSimulationMoveGame: () => boolean;
					isAlternatingMoveGame: () => boolean;
					hasSubgames: () => boolean;
				};

				if (gameExt.isDeductionPuzzle())
					continue;

				if (gameExt.isSimulationMoveGame())
					continue;

				if (!gameExt.isAlternatingMoveGame())
					continue;

				if (game.hasSubgames())
					continue;

				const filepathsGameName = StringRoutines.cleanGameName(gameName);
				const filepathsRulesetName = StringRoutines.cleanRulesetName(fullRulesetName.replaceAll("Ruleset/", ""));

				const rulesetResultsDirPath = resultsDir + filepathsGameName + filepathsRulesetName;
				if (fs.existsSync(rulesetResultsDirPath)) {
					const rulesetID = IdRuleset ? IdRuleset.get(game) : -1;

					if (rulesetID >= 0) {
						// Map from heuristic names to sum of scores for this ruleset
						const heuristicScoreSums = new Map<string, number>();
						// Map from heuristic names to how often we observed this heuristic in this ruleset
						const heuristicCounts = new Map<string, number>();

						const matchupDirs = fs.readdirSync(rulesetResultsDirPath, { withFileTypes: true });
						for (const matchupDirEntry of matchupDirs) {
							if (matchupDirEntry.isDirectory()) {
								const matchupPath = path.join(rulesetResultsDirPath, matchupDirEntry.name);
								const alphaRankPath = matchupPath + "/alpha_rank_data.csv";
								const resultLines = fs.readFileSync(alphaRankPath, "utf8").split("\n");

								// Skip index 0, that's just the headings
								for (let i = 1; i < resultLines.length; ++i) {
									const line = resultLines[i]!;
									if (line.trim().length === 0) continue;
									const idxQuote1 = 0;
									const idxQuote2 = line.indexOf('"', idxQuote1 + 1);
									const idxQuote3 = line.indexOf('"', idxQuote2 + 1);
									const idxQuote4 = line.indexOf('"', idxQuote3 + 1);

									const heuristicsTuple = line
										.substring(idxQuote1 + 2, idxQuote2 - 1)
										.replaceAll(" ", "")
										.replaceAll("'", "");
									const scoresTuple = line
										.substring(idxQuote3 + 2, idxQuote4 - 1)
										.replaceAll(" ", "");

									const heuristicNames = heuristicsTuple.split(",");
									const scores = scoresTuple.split(",");

									for (let j = 0; j < heuristicNames.length; ++j) {
										const scoreVal = parseFloat(scores[j]!);
										if (scoreVal < -1.0 || scoreVal > 1.0) {
											console.log(scores[j]);
											console.log("Line " + i + " of " + matchupPath + "/alpha_rank_data.csv");
										}

										// Convert score to "win percentage"
										const score = ((scoreVal + 1.0) / 2.0) * 100.0;

										const hName = heuristicNames[j]!;
										heuristicScoreSums.set(hName, (heuristicScoreSums.get(hName) ?? 0) + score);
										heuristicCounts.set(hName, (heuristicCounts.get(hName) ?? 0) + 1);
									}
								}
							}
						}

						const rulesetScoreData: ScoreData[] = [];

						for (const [heuristic] of heuristicScoreSums.entries()) {
							if (StringRoutines.isDigit(heuristic.charAt(heuristic.length - 1))) {
								// Need to do both merged and unmerged
								const truncatedName = heuristic.substring(0, heuristic.lastIndexOf("_"));

								// First do unmerged version
								let heuristicData: HeuristicData | null = null;
								for (const data of heuristicsList) {
									if (data.name === heuristic) {
										heuristicData = data;
										break;
									}
								}

								if (heuristicData === null) {
									heuristicData = new HeuristicData(heuristic, GenerateBaseHeuristicScoresDatabaseCSVs.HeuristicTypes.Unmerged);
									heuristicsList.push(heuristicData);
								}

								const heuristicID = heuristicData.id;
								const score = heuristicScoreSums.get(heuristic)! / heuristicCounts.get(heuristic)!;
								rulesetScoreData.push(new ScoreData(rulesetID, heuristicID, score));

								// And now the merged version
								heuristicData = null;
								for (const data of heuristicsList) {
									if (data.name === truncatedName) {
										heuristicData = data;
										break;
									}
								}

								if (heuristicData === null) {
									heuristicData = new HeuristicData(truncatedName, GenerateBaseHeuristicScoresDatabaseCSVs.HeuristicTypes.Merged);
									heuristicsList.push(heuristicData);
								}

								const mergedHeuristicID = heuristicData.id;

								// See if we need to update already-added score data, or add new data
								let shouldAdd = true;
								for (const data of rulesetScoreData) {
									if (data.heuristicID === mergedHeuristicID) {
										if (score > data.score)
											data.score = score;

										shouldAdd = false;
										break;
									}
								}

								if (shouldAdd)
									rulesetScoreData.push(new ScoreData(rulesetID, mergedHeuristicID, score));
							} else {
								// No merged version
								let heuristicData: HeuristicData | null = null;
								for (const data of heuristicsList) {
									if (data.name === heuristic) {
										heuristicData = data;
										break;
									}
								}

								if (heuristicData === null) {
									heuristicData = new HeuristicData(heuristic, GenerateBaseHeuristicScoresDatabaseCSVs.HeuristicTypes.Standard);
									heuristicsList.push(heuristicData);
								}

								const heuristicID = heuristicData.id;
								const score = heuristicScoreSums.get(heuristic)! / heuristicCounts.get(heuristic)!;
								rulesetScoreData.push(new ScoreData(rulesetID, heuristicID, score));
							}
						}

						for (const d of rulesetScoreData) scoreDataList.push(d);
					}
				}
			}
		}

		try {
			let heuristicsOutput = "";
			for (const data of heuristicsList) {
				heuristicsOutput += data.toString() + "\n";
			}
			fs.writeFileSync("../Mining/res/heuristics/Heuristics.csv", heuristicsOutput, "utf8");
		} catch (e) {
			console.error(e);
		}

		try {
			let rulesetHeuristicsOutput = "";
			for (const data of scoreDataList) {
				rulesetHeuristicsOutput += data.toString() + "\n";
			}
			fs.writeFileSync("../Mining/res/heuristics/RulesetHeuristics.csv", rulesetHeuristicsOutput, "utf8");
		} catch (e) {
			console.error(e);
		}
	}

	//-------------------------------------------------------------------------

	/**
	 * Main method to generate all our scripts.
	 * @java GenerateBaseHeuristicScoresDatabaseCSVs.main(String[])
	 */
	public static main(args: string[]): void {
		// define options for arg parser
		const argParse = new CommandLineArgParse(
			true,
			"Generates CSV files for database, describing scores of all base heuristics for all games."
		);

		{
			const opt = new CommandLineArgParse.ArgOption()
				.withNames("--results-dir")
				.withNumVals(1)
				.withType(CommandLineArgParse.OptionTypes.String)
				.setRequired();
			// opt.helpText is the string field (Java: .help("...") sets the description)
			opt.helpText = "Filepath for directory with per-game subdirectories of matchup directories.";
			argParse.addOption(opt);
		}

		// parse the args
		if (!argParse.parseArguments(args))
			return;

		GenerateBaseHeuristicScoresDatabaseCSVs.generateCSVs(argParse);
	}

	//-------------------------------------------------------------------------

}

//-----------------------------------------------------------------------------

/**
 * Data for Heuristics table.
 * @java GenerateBaseHeuristicScoresDatabaseCSVs.HeuristicData
 */
class HeuristicData {
	private static nextID: number = 1;

	readonly id: number;
	readonly name: string;
	readonly type: string;

	/** @java HeuristicData(String, HeuristicTypes) */
	public constructor(name: string, type: string) {
		this.id = HeuristicData.nextID++;
		this.name = name;
		this.type = type;
	}

	/** @java HeuristicData.toString() */
	public toString(): string {
		const typeOrdinal = Object.values(GenerateBaseHeuristicScoresDatabaseCSVs.HeuristicTypes).indexOf(
			this.type as typeof GenerateBaseHeuristicScoresDatabaseCSVs.HeuristicTypes[keyof typeof GenerateBaseHeuristicScoresDatabaseCSVs.HeuristicTypes]
		);
		return this.id + "," + this.name + "," + typeOrdinal;
	}
}

/**
 * Data for the table of ruleset+heuristic scores.
 * @java GenerateBaseHeuristicScoresDatabaseCSVs.ScoreData
 */
class ScoreData {
	private static nextID: number = 1;

	readonly id: number;
	readonly rulesetID: number;
	readonly heuristicID: number;
	score: number;

	/** @java ScoreData(int, int, double) */
	public constructor(rulesetID: number, heuristicID: number, score: number) {
		this.id = ScoreData.nextID++;
		this.rulesetID = rulesetID;
		this.heuristicID = heuristicID;
		this.score = score;
	}

	/** @java ScoreData.toString() */
	public toString(): string {
		return this.id + "," + this.rulesetID + "," + this.heuristicID + "," + this.score;
	}
}

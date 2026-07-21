// @java Mining/src/utils/trials/CreateSneliusClusterTrialsMuseumFeatures.java

import { fs } from "../../../../node-shim/fs-lazy.js";
import { GameLoader } from "../../../../../ludemes/other/GameLoader.js";
import { StringRoutines } from "../../../../Common/src/main/StringRoutines.js";
import { UnixPrintWriter } from "../../../../Common/src/main/UnixPrintWriter.js";

/**
 * Script to generate all the .sh to generate the different trials for the Snellius cluster on thin nodes.
 *
 * This is for the museum game rulesets with the features.
 *
 * @java utils.trials.CreateSneliusClusterTrialsMuseumFeatures
 * @author Eric.Piette and Dennis Soemers
 */
export class CreateSneliusClusterTrialsMuseumFeatures {

	/** @java CreateSneliusClusterTrialsMuseumFeatures.POLICIES */
	private static readonly POLICIES: string[] = [
		"Tree_1",
		"Tree_2",
		"Tree_3",
		"Tree_4",
		"Tree_5",
		"TSPG"
	];

	/**
	 * @java CreateSneliusClusterTrialsMuseumFeatures.main(String[])
	 */
	public static main(_args: string[]): void {
		const numPlayout = 100;
		const maxMove = 250; // Constants.DEFAULT_MOVES_LIMIT;
		const thinkingTime = 1;
		const mainScriptName = "GenTrials.sh";

		const processDataList: ProcessData[] = [];
		try {
			const mainWriter = new UnixPrintWriter(mainScriptName);
			const gameName = "/Ludus Coriovalli.lud";

			const game = GameLoader.loadGameFromName(gameName);

			const gameRulesetNames: string[] = [];
			const rulesetsInGame = game.description().rulesets();

			// Get all the rulesets of the game if it has some.
			if (rulesetsInGame !== null && rulesetsInGame.length > 0) {
				for (let rs = 0; rs < rulesetsInGame.length; rs++) {
					const ruleset = rulesetsInGame[rs]!;
					if (ruleset.optionSettings().length > 0) // We check if the ruleset is implemented.
						gameRulesetNames.push(ruleset.heading());
				}
			}

			// We get the name of all the rulesets
			for (const rulesetName of gameRulesetNames) {
				for (let i = 0; i < CreateSneliusClusterTrialsMuseumFeatures.POLICIES.length - 1; ++i) {
					for (let j = i + 1; j < CreateSneliusClusterTrialsMuseumFeatures.POLICIES.length; ++j) {
						processDataList.push(
							new ProcessData(
								gameName.substring(1) + '"' + " " + '"' + rulesetName + '"',
								CreateSneliusClusterTrialsMuseumFeatures.POLICIES[i]!,
								CreateSneliusClusterTrialsMuseumFeatures.POLICIES[j]!,
								StringRoutines.cleanGameName(gameName.replaceAll(".lud", "")),
								StringRoutines.cleanRulesetName(rulesetName).replaceAll("/", "_")
							)
						);
					}
				}

				console.log(gameName.substring(1) + "/" + rulesetName);
			}

			let scriptId = 0;

			for (let i = 0; i < Math.floor(processDataList.length / 42) + 1; i++) {
				const scriptName = "GenTrial_" + scriptId + ".sh";
				mainWriter.printlnStr("sbatch " + scriptName);

				try {
					const writer = new UnixPrintWriter(scriptName);
					writer.printlnStr("#!/bin/bash");
					writer.printlnStr("#SBATCH -J GenTrialsMuseumFeatures" + scriptId);
					writer.printlnStr("#SBATCH -p thin");
					writer.printlnStr("#SBATCH -o /home/piettee/Out/Out_%J.out");
					writer.printlnStr("#SBATCH -e /home/piettee/Out/Err_%J.err");
					writer.printlnStr("#SBATCH -t 6000");
					writer.printlnStr("#SBATCH -N 1");
					writer.printlnStr("#SBATCH --cpus-per-task=128");
					writer.printlnStr("#SBATCH --mem=234G");
					writer.printlnStr("#SBATCH --exclusive");
					writer.printlnStr("module load 2021");
					writer.printlnStr("module load Java/11.0.2");

					for (let j = 0; j < 42; j++) {
						const pIdx = i * 42 + j;

						if (pIdx < processDataList.length) {
							const processData = processDataList[pIdx]!;
							let agentString1: string;
							let agentString2: string;

							// Build string for first agent
							if (processData.agent1 === "TSPG") {
								const policyStrParts: string[] = [];
								policyStrParts.push("algorithm=Softmax");
								for (let p = 1; p <= 2; ++p) {
									policyStrParts.push(
										"policyweights" +
										p +
										"=/home/piettee/ludii/features" +
										processData.cleanGameName + "_" + processData.cleanRulesetName +
										"/PolicyWeightsTSPG_P" + p + "_00201.txt"
									);
								}
								policyStrParts.push("friendly_name=TSPG");
								policyStrParts.push("boosted=true");

								agentString1 = StringRoutines.join(";", policyStrParts);
							} else {
								agentString1 = StringRoutines.join(
									";",
									"algorithm=SoftmaxPolicyLogitTree",
									"policytrees=/" +
									StringRoutines.join(
										"/",
										"home",
										"piettee",
										"ludii",
										"features" + processData.cleanGameName + "_" + processData.cleanRulesetName,
										"CE_Selection_Logit_" + processData.agent1 + ".txt"
									),
									"friendly_name=" + processData.agent1,
									"greedy=false"
								);
							}

							// Build string for second agent
							if (processData.agent2 === "TSPG") {
								const policyStrParts: string[] = [];
								policyStrParts.push("algorithm=Softmax");
								for (let p = 1; p <= 2; ++p) {
									policyStrParts.push(
										"policyweights" +
										p +
										"=/home/piettee/ludii/features" +
										processData.cleanGameName + "_" + processData.cleanRulesetName +
										"/PolicyWeightsTSPG_P" + p + "_00201.txt"
									);
								}
								policyStrParts.push("friendly_name=TSPG");
								policyStrParts.push("boosted=true");

								agentString2 = StringRoutines.join(";", policyStrParts);
							} else {
								agentString2 = StringRoutines.join(
									";",
									"algorithm=SoftmaxPolicyLogitTree",
									"policytrees=/" +
									StringRoutines.join(
										"/",
										"home",
										"piettee",
										"ludii",
										"features" + processData.cleanGameName + "_" + processData.cleanRulesetName,
										"CE_Selection_Logit_" + processData.agent2 + ".txt"
									),
									"friendly_name=" + processData.agent2,
									"greedy=false"
								);
							}

							let jobLine = "taskset -c ";
							jobLine += (3 * j) + "," + (3 * j + 1) + "," + (3 * j + 2) + " ";
							jobLine += "java -Xms5120M -Xmx5120M -XX:+HeapDumpOnOutOfMemoryError -da -dsa -XX:+UseStringDeduplication -jar \"/home/piettee/ludii/Trials/Ludii.jar\" --generate-trials-parallel ";
							jobLine += maxMove + " " + thinkingTime + " " + numPlayout + " " + '"' + agentString1 + '"' + " " + '"';
							jobLine += processData.rulesetName;
							jobLine += " " + StringRoutines.quote(agentString2);
							jobLine += " " + processData.agent1 + "_vs_" + processData.agent2;
							jobLine += " " + "> /home/piettee/Out/Out_${SLURM_JOB_ID}_" + j + ".out &";
							writer.printlnStr(jobLine);
						}
					}
					writer.printlnStr("wait");
					fs.writeFileSync(scriptName, writer.flush(), "utf8");
				} catch (e) {
					console.error(e);
				}
				scriptId++;
			}

			fs.writeFileSync(mainScriptName, mainWriter.flush(), "utf8");
		} catch (e) {
			console.error(e);
		}
	}

}

/**
 * Wrapper for data we need for an individual Java process (of which we run multiple per job).
 * @java CreateSneliusClusterTrialsMuseumFeatures.ProcessData
 */
class ProcessData {

	readonly rulesetName: string;
	readonly agent1: string;
	readonly agent2: string;
	readonly cleanGameName: string;
	readonly cleanRulesetName: string;

	/**
	 * Constructor.
	 * @java ProcessData(String, String, String, String, String)
	 */
	public constructor(
		rulesetName: string,
		agent1: string,
		agent2: string,
		cleanGameName: string,
		cleanRulesetName: string
	) {
		this.rulesetName = rulesetName;
		this.agent1 = agent1;
		this.agent2 = agent2;
		this.cleanGameName = cleanGameName;
		this.cleanRulesetName = cleanRulesetName;
	}

}

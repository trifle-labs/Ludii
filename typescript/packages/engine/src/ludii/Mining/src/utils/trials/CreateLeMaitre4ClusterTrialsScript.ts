// @java Mining/src/utils/trials/CreateLeMaitre4ClusterTrialsScript.java

import { fs } from "../../../../node-shim/fs-lazy.js";
import { GameLoader } from "../../../../../ludemes/other/GameLoader.js";
import { FileHandling } from "../../../../Common/src/main/FileHandling.js";
import { UnixPrintWriter } from "../../../../Common/src/main/UnixPrintWriter.js";

/**
 * Script to generate all the .sh to generate the different trials for LeMaitre4 cluster.
 *
 * @java utils.trials.CreateLeMaitre4ClusterTrialsScript
 * @author Eric.Piette
 */
export class CreateLeMaitre4ClusterTrialsScript {

	/** Max wall time (in minutes). @java CreateLeMaitre4ClusterTrialsScript.MAX_WALL_TIME */
	private static readonly MAX_WALL_TIME: number = 1500;

	/** Memory to assign to JVM. @java CreateLeMaitre4ClusterTrialsScript.JVM_MEM_MIN */
	private static readonly JVM_MEM_MIN: string = "512g"; // 128g

	/** Memory to assign to JVM. @java CreateLeMaitre4ClusterTrialsScript.JVM_MEM_MAX */
	private static readonly JVM_MEM_MAX: string = "512g"; // 128g

	// TODO no idea what this should be on Lemaitre4
	/** Cluster doesn't seem to let us request more memory than this for any single job (on a single node). @java CreateLeMaitre4ClusterTrialsScript.MAX_REQUEST_MEM */
	private static readonly MAX_REQUEST_MEM: number = 600; // 600

	/** Number of cores per node (this is for Lemaitre4). @java CreateLeMaitre4ClusterTrialsScript.CORES_PER_NODE */
	private static readonly CORES_PER_NODE: number = 128; // 32

	/** Number of cores per Java call. @java CreateLeMaitre4ClusterTrialsScript.CORES_PER_PROCESS */
	private static readonly CORES_PER_PROCESS: number = 128;

	/** Number of processes we can put in a single job (on a single node). @java CreateLeMaitre4ClusterTrialsScript.PROCESSES_PER_JOB */
	private static readonly PROCESSES_PER_JOB: number = CreateLeMaitre4ClusterTrialsScript.CORES_PER_NODE / CreateLeMaitre4ClusterTrialsScript.CORES_PER_PROCESS;

	/**
	 * @java CreateLeMaitre4ClusterTrialsScript.main(String[])
	 */
	public static main(_args: string[]): void {
		const numPlayout = 100;
		const maxMove = 5000; // Constants.DEFAULT_MOVES_LIMIT;
		const thinkingTime = 1;
		const agentName = "Random"; // Can be "UCT",  "Alpha-Beta", "Alpha-Beta-UCT", "AB-Odd-Even", or "Random"
		const clusterLogin = "epiette";
		const mainScriptName = "GenTrials.sh";
		const numRulesetsPerBatch = 1; // 48

		const rulesetNames: string[] = [];
		try {
			const mainWriter = new UnixPrintWriter(mainScriptName);
			const gameNames: string[] = FileHandling.listGames();

			for (let index = 0; index < gameNames.length; index++) {
				const gameName = gameNames[index]!;
				if (gameName.replaceAll("\\", "/").includes("/lud/bad/"))
					continue;

				if (gameName.replaceAll("\\", "/").includes("/lud/wip/"))
					continue;

				if (gameName.replaceAll("\\", "/").includes("/lud/WishlistDLP/"))
					continue;

				if (gameName.replaceAll("\\", "/").includes("/lud/test/"))
					continue;

				if (gameName.replaceAll("\\", "/").includes("subgame"))
					continue;

				if (gameName.replaceAll("\\", "/").includes("reconstruction/pending/"))
					continue;

				if (gameName.replaceAll("\\", "/").includes("reconstruction/validation/"))
					continue;

				const game = GameLoader.loadGameFromName(gameName);

				const gameRulesetNames: string[] = [];
				const rulesetsInGame = game.description().rulesets();

				// Get all the rulesets of the game if it has some.
				if (rulesetsInGame !== null && rulesetsInGame.length > 0) {
					for (let rs = 0; rs < rulesetsInGame.length; rs++) {
						const ruleset = rulesetsInGame[rs]!;
						if (ruleset.optionSettings().length > 0 && !ruleset.heading().includes("Incomplete")) // We check if the ruleset is implemented.
							gameRulesetNames.push(ruleset.heading());
					}
				}

				// We get the name of all the rulesets
				if (gameRulesetNames.length === 0) {
					rulesetNames.push(gameName.substring(1) + '"');
					console.log(gameName.substring(1));
				} else {
					for (const rulesetName of gameRulesetNames) {
						rulesetNames.push(gameName.substring(1) + '"' + " " + '"' + rulesetName + '"');
						console.log(gameName.substring(1) + "/" + rulesetName);
					}
				}
			}

			// Write scripts with all the processes
			// Collections.shuffle(rulesetNames) — shuffle in place
			for (let i = rulesetNames.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[rulesetNames[i], rulesetNames[j]] = [rulesetNames[j]!, rulesetNames[i]!];
			}

			console.log("***************************" + rulesetNames.length + " rulesets ***************************");
			let scriptId = 0;

			for (let i = 0; i < Math.floor(rulesetNames.length / numRulesetsPerBatch) + 1; i++) {
				const scriptName = "GenTrial_" + scriptId + ".sh";
				mainWriter.printlnStr("sbatch " + scriptName);

				try {
					const writer = new UnixPrintWriter(scriptName);
					writer.printlnStr("#!/bin/bash");
					writer.printlnStr("#SBATCH -J GenTrials" + agentName + "Script" + scriptId);
					writer.printlnStr("#SBATCH -p batch");
					writer.printlnStr("#SBATCH -o /globalscratch/ucl/ingi/" + clusterLogin + "/Out/Out_%J.out");
					writer.printlnStr("#SBATCH -e /globalscratch/ucl/ingi/" + clusterLogin + "/Err/Err_%J.err");
					writer.printlnStr("#SBATCH -t " + CreateLeMaitre4ClusterTrialsScript.MAX_WALL_TIME);
					writer.printlnStr("#SBATCH -N 1");

					const numProcessesThisJob = CreateLeMaitre4ClusterTrialsScript.PROCESSES_PER_JOB;

					writer.printlnStr("#SBATCH --cpus-per-task=" + (numProcessesThisJob * CreateLeMaitre4ClusterTrialsScript.CORES_PER_PROCESS));
					writer.printlnStr("#SBATCH --mem=" + CreateLeMaitre4ClusterTrialsScript.MAX_REQUEST_MEM + "G");
					writer.printlnStr("#SBATCH --exclusive");
					writer.printlnStr("module load Java/11.0.20");

					for (let j = 0; j < numRulesetsPerBatch; j++) {
						if ((i * numRulesetsPerBatch + j) < rulesetNames.length) {
							let jobLine = "";
							jobLine += "java -Xms" + CreateLeMaitre4ClusterTrialsScript.JVM_MEM_MIN + " -Xmx" + CreateLeMaitre4ClusterTrialsScript.JVM_MEM_MAX + " -XX:+HeapDumpOnOutOfMemoryError -da -dsa -XX:+UseStringDeduplication -jar \"/globalscratch/ucl/ingi/" + clusterLogin + "/ludii/Trials/Ludii.jar\" --generate-trials-parallel ";
							jobLine += maxMove + " " + thinkingTime + " " + numPlayout + " " + '"' + agentName + '"' + " " + '"';
							jobLine += rulesetNames[i * numRulesetsPerBatch + j];
							jobLine += " " + "> /globalscratch/ucl/ingi/" + clusterLogin + "/Out/Out_${SLURM_JOB_ID}_" + j + ".out &";
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

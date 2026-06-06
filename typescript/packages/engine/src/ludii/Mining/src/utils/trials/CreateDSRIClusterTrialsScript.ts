// @java Mining/src/utils/trials/CreateDSRIClusterTrialsScript.java

import * as fs from "fs";
import * as path from "path";
import { GameLoader } from "../../../../../ludemes/other/GameLoader.js";
import { FileHandling } from "../../../../Common/src/main/FileHandling.js";
import { StringRoutines } from "../../../../Common/src/main/StringRoutines.js";
import { UnixPrintWriter } from "../../../../Common/src/main/UnixPrintWriter.js";

/**
 * Script to generate all the .sh to generate the different trials.
 *
 * @java utils.trials.CreateDSRIClusterTrialsScript
 * @author Eric.Piette
 */
export class CreateDSRIClusterTrialsScript {

	/**
	 * @java CreateDSRIClusterTrialsScript.main(String[])
	 */
	public static main(_args: string[]): void {
		let bashName = "";
		let jobName = "";

		// For runAll.sh
		const deleteAll = "";

		// For Dockerfile
		const beginDockerFile = "FROM ghcr.io/maastrichtu-ids/openjdk:18\n"
			+ "RUN mkdir -p /app\n"
			+ "WORKDIR /app\n"
			+ "ENTRYPOINT [\"java\", \"-jar\", \"/data/ludii.jar\"]\n"
			+ "CMD [";
		const endDockerFile = "]";

		const numPlayout = 100;
		const maxMove = 5000; // Constants.DEFAULT_MOVES_LIMIT;
		const thinkingTime = 1;
		const agentName = "Random"; // Can be "UCT",  "Alpha-Beta", "Alpha-Beta-UCT", "AB-Odd-Even", or "Random"

		const folderGen = "Gen" + agentName + path.sep;
		const mainScriptName = folderGen + "allRun.sh";

		const genFolderFile = folderGen + jobName;
		if (!fs.existsSync(genFolderFile))
			fs.mkdirSync(genFolderFile, { recursive: true });

		try {
			const mainWriter = new UnixPrintWriter(mainScriptName);
			// Write the delete lines in the big bash.
			mainWriter.printlnStr(deleteAll);

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

				const fileName = gameName.length === 0 ? ""
					: StringRoutines.cleanGameName(gameName.substring(gameName.lastIndexOf('/') + 1, gameName.length));

				const rulesetNames: string[] = [];
				const rulesetsInGame = game.description().rulesets();

				// Get all the rulesets of the game if it has some.
				if (rulesetsInGame !== null && rulesetsInGame.length > 0) {
					for (let rs = 0; rs < rulesetsInGame.length; rs++) {
						const ruleset = rulesetsInGame[rs]!;
						if (ruleset.optionSettings().length > 0) // We check if the ruleset is implemented.
							rulesetNames.push(ruleset.heading());
					}
				}

				if (rulesetNames.length === 0) {
					// Get the name of the bash file.
					bashName = "job" + fileName;
					// Get the name of the job.
					jobName = bashName + agentName + "Trials";
					jobName = jobName.toLowerCase();
					jobName = jobName.replace(/_/g, "");

					// Write the line in the big bash
					mainWriter.printlnStr(CreateDSRIClusterTrialsScript.createBashJob(bashName));

					// Write bash file for a specific ruleset
					const rulesetScriptName = folderGen + "run" + bashName + ".sh";
					try {
						const rulesetWriter = new UnixPrintWriter(rulesetScriptName);
						rulesetWriter.printlnStr(CreateDSRIClusterTrialsScript.createRulesetBashJob(jobName));
						const jobFolderFile = folderGen + jobName;
						if (!fs.existsSync(jobFolderFile))
							fs.mkdirSync(jobFolderFile, { recursive: true });
						fs.writeFileSync(rulesetScriptName, rulesetWriter.flush(), "utf8");
					} catch (e) {
						console.error(e);
					}

					// Write YML file for a specific ruleset
					const YMLName = folderGen + jobName + path.sep + jobName + ".yml";
					try {
						const ymlWriter = new UnixPrintWriter(YMLName);
						ymlWriter.printlnStr(CreateDSRIClusterTrialsScript.createYML(jobName));
						fs.writeFileSync(YMLName, ymlWriter.flush(), "utf8");
					} catch (e) {
						console.error(e);
					}

					// Write Docker file for a specific ruleset
					const dockerName = folderGen + jobName + path.sep + "Dockerfile";
					try {
						const dockerWriter = new UnixPrintWriter(dockerName);
						dockerWriter.print(beginDockerFile);
						dockerWriter.print("\"--generate-trials\", ");
						dockerWriter.print("\"" + maxMove + "\", ");
						dockerWriter.print("\"" + thinkingTime + "\", ");
						dockerWriter.print("\"" + numPlayout + "\", ");
						dockerWriter.print("\"" + agentName + "\", ");
						dockerWriter.print("\"" + gameName.substring(1) + "\"");
						dockerWriter.printlnStr(endDockerFile);
						fs.writeFileSync(dockerName, dockerWriter.flush(), "utf8");
					} catch (e) {
						console.error(e);
					}

					console.log(CreateDSRIClusterTrialsScript.createBashJob(bashName) + " " + "written.");
				} else {
					for (let idRuleset = 0; idRuleset < rulesetNames.length; idRuleset++) {
						const rulesetJobName = "Ruleset" + idRuleset; // Need to modify the name of the job bc DSRI has a limit of 58 chars
						const rulesetName = rulesetNames[idRuleset]!;
						// Get the name of the bash file.
						bashName = "job" + fileName + "-" + rulesetJobName;
						// Get the name of the job.
						jobName = "job" + fileName + "-" + rulesetJobName + agentName + "Trials";
						jobName = jobName.toLowerCase();
						jobName = jobName.replace(/_/g, "");

						// Write the line in the big bash
						mainWriter.printlnStr(CreateDSRIClusterTrialsScript.createBashJob(bashName));

						// Write bash file for a specific ruleset
						const rulesetScriptName = folderGen + "run" + bashName + ".sh";
						try {
							const rulesetWriter = new UnixPrintWriter(rulesetScriptName);
							rulesetWriter.printlnStr(CreateDSRIClusterTrialsScript.createRulesetBashJob(jobName));
							const jobFolderFile = folderGen + jobName;
							if (!fs.existsSync(jobFolderFile))
								fs.mkdirSync(jobFolderFile, { recursive: true });
							fs.writeFileSync(rulesetScriptName, rulesetWriter.flush(), "utf8");
						} catch (e) {
							console.error(e);
						}

						// Write YML file for a specific ruleset
						const YMLName = folderGen + jobName + path.sep + jobName + ".yml";
						try {
							const ymlWriter = new UnixPrintWriter(YMLName);
							ymlWriter.printlnStr(CreateDSRIClusterTrialsScript.createYML(jobName));
							fs.writeFileSync(YMLName, ymlWriter.flush(), "utf8");
						} catch (e) {
							console.error(e);
						}

						// Write Docker file for a specific ruleset
						const dockerName = folderGen + jobName + path.sep + "Dockerfile";
						try {
							const dockerWriter = new UnixPrintWriter(dockerName);
							dockerWriter.print(beginDockerFile);
							dockerWriter.print("\"--generate-trials\", ");
							dockerWriter.print("\"" + maxMove + "\", ");
							dockerWriter.print("\"" + thinkingTime + "\", ");
							dockerWriter.print("\"" + numPlayout + "\", ");
							dockerWriter.print("\"" + agentName + "\", ");
							dockerWriter.print("\"" + gameName.substring(1) + "\", ");
							dockerWriter.print("\"" + rulesetName + "\"");
							dockerWriter.printlnStr(endDockerFile);
							fs.writeFileSync(dockerName, dockerWriter.flush(), "utf8");
						} catch (e) {
							console.error(e);
						}

						console.log(CreateDSRIClusterTrialsScript.createBashJob(bashName) + " " + "written.");
					}
				}
			}

			fs.writeFileSync(mainScriptName, mainWriter.flush(), "utf8");
		} catch (e) {
			console.error(e);
		}
	}

	/**
	 * @param jobName The name of the job.
	 * @return The bash line in runAll.sh to run the job.
	 * @java CreateDSRIClusterTrialsScript.createBashJob(String)
	 */
	public static createBashJob(jobName: string): string {
		return "bash run" + jobName + ".sh&";
	}

	/**
	 * @param jobName The name of the job.
	 * @return The bash file to run the job for a specific ruleset.
	 * @java CreateDSRIClusterTrialsScript.createRulesetBashJob(String)
	 */
	public static createRulesetBashJob(jobName: string): string {
		return "cd " + jobName + "\n"
			+ "oc new-build --name " + jobName + " --binary\n"
			+ "oc start-build " + jobName + " --from-dir=. --follow --wait\n"
			+ "oc apply -f " + jobName + ".yml\n"
			+ "cd ..";
	}

	/**
	 * @param jobName The name of the job.
	 * @return The YML file for a specific ruleset.
	 * @java CreateDSRIClusterTrialsScript.createYML(String)
	 */
	public static createYML(jobName: string): string {
		return "apiVersion: batch/v1\n"
			+ "kind: Job\n"
			+ "metadata:\n"
			+ "  name: " + jobName + "\n"
			+ "  labels:\n"
			+ "    app: \"" + jobName + "\"\n"
			+ "spec:\n"
			+ "  template:\n"
			+ "    metadata:\n"
			+ "      name: " + jobName + "\n"
			+ "    spec:\n"
			+ "      serviceAccountName: anyuid\n"
			+ "      containers:\n"
			+ "        - name: " + jobName + "\n"
			+ "          image: image-registry.openshift-image-registry.svc:5000/ludii/" + jobName + ":latest\n"
			+ "          imagePullPolicy: Always\n"
			+ "          # command: [\"--help\"] \n"
			+ "          volumeMounts:\n"
			+ "            - mountPath: /data\n"
			+ "              name: data\n"
			+ "      resources:\n"
			+ "        requests:\n"
			+ "          cpu: \"1\"\n"
			+ "          memory: \"4G\"\n"
			+ "        limits:\n"
			+ "          cpu: \"2\"\n"
			+ "          memory: \"8G\"\n"
			+ "      volumes:\n"
			+ "        - name: data\n"
			+ "          persistentVolumeClaim:\n"
			+ "            claimName: ludii-job-storage\n"
			+ "      restartPolicy: Never";
	}

}

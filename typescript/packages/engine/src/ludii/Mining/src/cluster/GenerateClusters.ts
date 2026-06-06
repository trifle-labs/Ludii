// @java Mining/src/cluster/GenerateClusters.java

import * as fs from "fs";

/**
 * Generate the clusters based on the coordinates obtained with Sklearn.
 *
 * @java cluster.GenerateClusters
 * @author Eric.Piette
 */
export class GenerateClusters {

	// Coordinates of the 9 sub-clusters of Cluster 3

	/** @java GenerateClusters.coordinatesPath */
	static readonly coordinatesPath: string = "./res/cluster/input/coordinatesCluster3.csv";
	/** @java GenerateClusters.numClusters */
	static readonly numClusters: number = 12;

	// Cluster 3.1 area
	/** @java GenerateClusters.xMinCluster1 */ static readonly xMinCluster1: number  = -4;
	/** @java GenerateClusters.xMaxCluster1 */ static readonly xMaxCluster1: number  = 3;
	/** @java GenerateClusters.yMinCluster1 */ static readonly yMinCluster1: number  = 10.8;
	/** @java GenerateClusters.yMaxCluster1 */ static readonly yMaxCluster1: number  = 19;

	// Cluster 3.2 area
	/** @java GenerateClusters.xMinCluster2 */ static readonly xMinCluster2: number  = 6.5;
	/** @java GenerateClusters.xMaxCluster2 */ static readonly xMaxCluster2: number  = 12;
	/** @java GenerateClusters.yMinCluster2 */ static readonly yMinCluster2: number  = 5.4;
	/** @java GenerateClusters.yMaxCluster2 */ static readonly yMaxCluster2: number  = 12;

	// Cluster 3.3 area
	/** @java GenerateClusters.xMinCluster3 */ static readonly xMinCluster3: number  = 5.4;
	/** @java GenerateClusters.xMaxCluster3 */ static readonly xMaxCluster3: number  = 13;
	/** @java GenerateClusters.yMinCluster3 */ static readonly yMinCluster3: number  = -2.3;
	/** @java GenerateClusters.yMaxCluster3 */ static readonly yMaxCluster3: number  = 3;

	// Cluster 3.4 area
	/** @java GenerateClusters.xMinCluster4 */ static readonly xMinCluster4: number  = 6.5;
	/** @java GenerateClusters.xMaxCluster4 */ static readonly xMaxCluster4: number  = 11;
	/** @java GenerateClusters.yMinCluster4 */ static readonly yMinCluster4: number  = -7;
	/** @java GenerateClusters.yMaxCluster4 */ static readonly yMaxCluster4: number  = -3;

	// Cluster 3.5 area
	/** @java GenerateClusters.xMinCluster5 */ static readonly xMinCluster5: number  = 4.8;
	/** @java GenerateClusters.xMaxCluster5 */ static readonly xMaxCluster5: number  = 8;
	/** @java GenerateClusters.yMinCluster5 */ static readonly yMinCluster5: number  = -10;
	/** @java GenerateClusters.yMaxCluster5 */ static readonly yMaxCluster5: number  = -7.5;

	// Cluster 3.6 area
	/** @java GenerateClusters.xMinCluster6 */ static readonly xMinCluster6: number  = -1.5;
	/** @java GenerateClusters.xMaxCluster6 */ static readonly xMaxCluster6: number  = 5;
	/** @java GenerateClusters.yMinCluster6 */ static readonly yMinCluster6: number  = -13.4;
	/** @java GenerateClusters.yMaxCluster6 */ static readonly yMaxCluster6: number  = -9.8;

	/** @java GenerateClusters.secondxMinCluster6 */ static readonly secondxMinCluster6: number = -3.5;
	/** @java GenerateClusters.secondxMaxCluster6 */ static readonly secondxMaxCluster6: number = 3;
	/** @java GenerateClusters.secondyMinCluster6 */ static readonly secondyMinCluster6: number = -11.58;
	/** @java GenerateClusters.secondyMaxCluster6 */ static readonly secondyMaxCluster6: number = -8.3;

	/** @java GenerateClusters.thirdxMinCluster6 */ static readonly thirdxMinCluster6: number  = -1.6;
	/** @java GenerateClusters.thirdxMaxCluster6 */ static readonly thirdxMaxCluster6: number  = 2;
	/** @java GenerateClusters.thirdyMinCluster6 */ static readonly thirdyMinCluster6: number  = -9.45;
	/** @java GenerateClusters.thirdyMaxCluster6 */ static readonly thirdyMaxCluster6: number  = -7.28;

	// Cluster 3.7 area
	/** @java GenerateClusters.xMinCluster7 */ static readonly xMinCluster7: number  = -11.66;
	/** @java GenerateClusters.xMaxCluster7 */ static readonly xMaxCluster7: number  = -5.22;
	/** @java GenerateClusters.yMinCluster7 */ static readonly yMinCluster7: number  = -6.30;
	/** @java GenerateClusters.yMaxCluster7 */ static readonly yMaxCluster7: number  = 0.25;

	/** @java GenerateClusters.secondxMinCluster7 */ static readonly secondxMinCluster7: number = -7.35;
	/** @java GenerateClusters.secondxMaxCluster7 */ static readonly secondxMaxCluster7: number = -4;
	/** @java GenerateClusters.secondyMinCluster7 */ static readonly secondyMinCluster7: number = 1.0;
	/** @java GenerateClusters.secondyMaxCluster7 */ static readonly secondyMaxCluster7: number = 2.25;

	// Cluster 3.8 area
	/** @java GenerateClusters.xMinCluster8 */ static readonly xMinCluster8: number  = -18;
	/** @java GenerateClusters.xMaxCluster8 */ static readonly xMaxCluster8: number  = -11;
	/** @java GenerateClusters.yMinCluster8 */ static readonly yMinCluster8: number  = -2.3;
	/** @java GenerateClusters.yMaxCluster8 */ static readonly yMaxCluster8: number  = 1.3;

	// Cluster 3.9 area
	/** @java GenerateClusters.xMinCluster9 */ static readonly xMinCluster9: number  = -10.9;
	/** @java GenerateClusters.xMaxCluster9 */ static readonly xMaxCluster9: number  = -6;
	/** @java GenerateClusters.yMinCluster9 */ static readonly yMinCluster9: number  = 4.4;
	/** @java GenerateClusters.yMaxCluster9 */ static readonly yMaxCluster9: number  = 8.1;

	// Cluster 3.10 area
	/** @java GenerateClusters.xMinCluster10 */ static readonly xMinCluster10: number = -3;
	/** @java GenerateClusters.xMaxCluster10 */ static readonly xMaxCluster10: number = 0.8;
	/** @java GenerateClusters.yMinCluster10 */ static readonly yMinCluster10: number = 1.31;
	/** @java GenerateClusters.yMaxCluster10 */ static readonly yMaxCluster10: number = 9;

	// Cluster 3.11 area
	/** @java GenerateClusters.xMinCluster11 */ static readonly xMinCluster11: number = 1.43;
	/** @java GenerateClusters.xMaxCluster11 */ static readonly xMaxCluster11: number = 6;
	/** @java GenerateClusters.yMinCluster11 */ static readonly yMinCluster11: number = 6;
	/** @java GenerateClusters.yMaxCluster11 */ static readonly yMaxCluster11: number = 10;

	// Cluster 3.12 area
	/** @java GenerateClusters.xMinCluster12 */ static readonly xMinCluster12: number = -5.2;
	/** @java GenerateClusters.xMaxCluster12 */ static readonly xMaxCluster12: number = -0.55;
	/** @java GenerateClusters.yMinCluster12 */ static readonly yMinCluster12: number = -5.45;
	/** @java GenerateClusters.yMaxCluster12 */ static readonly yMaxCluster12: number = -0.9;

	/** @java GenerateClusters.gamePath */
	static readonly gamePath: string = "./res/cluster/input/Games.csv";

	/**
	 * Main method to call the reconstruction with command lines.
	 * @java GenerateClusters.main(String[])
	 */
	public static main(_args: string[]): void {
		// init game names list
		const gameNames: string[] = [];
		{
			const content = fs.readFileSync(GenerateClusters.gamePath, "utf8");
			for (const rawLine of content.split("\n")) {
				const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
				if (line.length > 0)
					gameNames.push(line.substring(1, line.length - 1)); // we remove the quotes.
			}
		}

		// init the clusters results
		const clusters: string[][] = [];
		for (let i = 0; i < GenerateClusters.numClusters; i++)
			clusters.push([]);

		// Read the CSV line by line.
		const coordinates: string[] = [];
		{
			const content = fs.readFileSync(GenerateClusters.coordinatesPath, "utf8");
			for (const rawLine of content.split("\n")) {
				const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
				if (line.length > 0)
					coordinates.push(line);
			}
		}

		for (let i = 0; i < coordinates.length; i++) {
			const gameAndCoordinates = coordinates[i]!.split(";");
			const gameName = gameAndCoordinates[0]!;
			const x = parseFloat(gameAndCoordinates[1]!);
			const y = parseFloat(gameAndCoordinates[2]!);

			if (x >= GenerateClusters.xMinCluster1 && x <= GenerateClusters.xMaxCluster1 && y >= GenerateClusters.yMinCluster1 && y <= GenerateClusters.yMaxCluster1)
				clusters[0]!.push(gameName);
			else if (x >= GenerateClusters.xMinCluster2 && x <= GenerateClusters.xMaxCluster2 && y >= GenerateClusters.yMinCluster2 && y <= GenerateClusters.yMaxCluster2)
				clusters[1]!.push(gameName);
			else if (x >= GenerateClusters.xMinCluster3 && x <= GenerateClusters.xMaxCluster3 && y >= GenerateClusters.yMinCluster3 && y <= GenerateClusters.yMaxCluster3)
				clusters[2]!.push(gameName);
			else if (x >= GenerateClusters.xMinCluster4 && x <= GenerateClusters.xMaxCluster4 && y >= GenerateClusters.yMinCluster4 && y <= GenerateClusters.yMaxCluster4)
				clusters[3]!.push(gameName);
			else if (x >= GenerateClusters.xMinCluster5 && x <= GenerateClusters.xMaxCluster5 && y >= GenerateClusters.yMinCluster5 && y <= GenerateClusters.yMaxCluster5)
				clusters[4]!.push(gameName);
			else if (x >= GenerateClusters.xMinCluster6 && x <= GenerateClusters.xMaxCluster6 && y >= GenerateClusters.yMinCluster6 && y <= GenerateClusters.yMaxCluster6)
				clusters[5]!.push(gameName);
			else if (x >= GenerateClusters.secondxMinCluster6 && x <= GenerateClusters.secondxMaxCluster6 && y >= GenerateClusters.secondyMinCluster6 && y <= GenerateClusters.secondyMaxCluster6)
				clusters[5]!.push(gameName);
			else if (x >= GenerateClusters.thirdxMinCluster6 && x <= GenerateClusters.thirdxMaxCluster6 && y >= GenerateClusters.thirdyMinCluster6 && y <= GenerateClusters.thirdyMaxCluster6)
				clusters[5]!.push(gameName);
			else if (x >= GenerateClusters.xMinCluster7 && x <= GenerateClusters.xMaxCluster7 && y >= GenerateClusters.yMinCluster7 && y <= GenerateClusters.yMaxCluster7)
				clusters[6]!.push(gameName);
			else if (x >= GenerateClusters.secondxMinCluster7 && x <= GenerateClusters.secondxMaxCluster7 && y >= GenerateClusters.secondyMinCluster7 && y <= GenerateClusters.secondyMaxCluster7)
				clusters[6]!.push(gameName);
			else if (x >= GenerateClusters.xMinCluster8 && x <= GenerateClusters.xMaxCluster8 && y >= GenerateClusters.yMinCluster8 && y <= GenerateClusters.yMaxCluster8)
				clusters[7]!.push(gameName);
			else if (x >= GenerateClusters.xMinCluster9 && x <= GenerateClusters.xMaxCluster9 && y >= GenerateClusters.yMinCluster9 && y <= GenerateClusters.yMaxCluster9)
				clusters[8]!.push(gameName);
			else if (x >= GenerateClusters.xMinCluster10 && x <= GenerateClusters.xMaxCluster10 && y >= GenerateClusters.yMinCluster10 && y <= GenerateClusters.yMaxCluster10)
				clusters[9]!.push(gameName);
			else if (x >= GenerateClusters.xMinCluster11 && x <= GenerateClusters.xMaxCluster11 && y >= GenerateClusters.yMinCluster11 && y <= GenerateClusters.yMaxCluster11)
				clusters[10]!.push(gameName);
			else if (x >= GenerateClusters.xMinCluster12 && x <= GenerateClusters.xMaxCluster12 && y >= GenerateClusters.yMinCluster12 && y <= GenerateClusters.yMaxCluster12)
				clusters[11]!.push(gameName);
			else
				console.error(gameName + " does not go to any cluster");
		}

		for (let i = 0; i < GenerateClusters.numClusters; i++) {
			console.log("****************** Cluster " + (i + 1) + "  **************************");
			for (let j = 0; j < clusters[i]!.length; j++)
				console.log(clusters[i]![j]);
			console.log("*****Size = " + clusters[i]!.length);
			console.log();
		}

		const SQLRequest = "SELECT DISTINCT GameRulesets.Id AS GameRulesetsId, GameRulesets.Name AS GameRulesetsName, Games.Id AS GamesId, Games.Name AS GamesName FROM GameRulesets, Games, RulesetConcepts WHERE Games.Id = GameRulesets.GameId AND RulesetConcepts.RulesetId = GameRulesets.Id AND (GameRulesets.Type = 1 OR GameRulesets.Type = 3) AND Games.DLPGame = 1 AND (";
		let SQLRequestCluster1 = SQLRequest;
		let SQLRequestCluster2 = SQLRequest;
		let SQLRequestCluster3 = SQLRequest;
		let SQLRequestCluster4 = SQLRequest;

		// Request for Cluster 1.
		for (let i = 0; i < clusters[0]!.length - 1; i++) {
			let gameName = clusters[0]![i]!;
			let found = false;
			while (!found) {
				const gameNameWithUnderscore = gameName.substring(0, gameName.lastIndexOf('_'));
				gameName = gameNameWithUnderscore.replace(/_/g, ' ');
				for (let j = 0; j < gameNames.length; j++) {
					if (gameNames[j]!.replace(/'/g, "").replace(/\(/g, "").replace(/\)/g, "").replace(/-/g, "") === gameName.replace(/-/g, "")) {
						if (gameNames[j]!.replace(/'/g, "").replace(/\(/g, "").replace(/\)/g, "") === gameName) {
							found = true;
							gameName = gameNames[j]!;
							SQLRequestCluster1 += "Games.Name = \\\"" + gameName + "\\\" OR ";
							break;
						}
					}
				}
				gameName = gameNameWithUnderscore;
				if (!gameName.includes("_")) {
					for (let j = 0; j < gameNames.length; j++) {
						if (gameNames[j]!.replace(/'/g, "").replace(/\(/g, "").replace(/\)/g, "") === gameName) {
							found = true;
							gameName = gameNames[j]!;
							SQLRequestCluster1 += "Games.Name = \\\"" + gameName + "\\\" OR ";
							break;
						}
					}
					if (!found) {
						console.error(clusters[0]![i] + " is never found in the list of game names.");
						process.exit(1);
					}
				}
			}
		}
		{
			let gameName = clusters[0]![clusters[0]!.length - 1]!;
			let found = false;
			while (!found) {
				const gameNameWithUnderscore = gameName.substring(0, gameName.lastIndexOf('_'));
				gameName = gameNameWithUnderscore.replace(/_/g, ' ');
				for (let j = 0; j < gameNames.length; j++) {
					if (gameNames[j]!.replace(/'/g, "").replace(/\(/g, "").replace(/\)/g, "") === gameName) {
						found = true;
						gameName = gameNames[j]!;
						SQLRequestCluster1 += "Games.Name = \\\"" + gameName + "\\\")";
						break;
					}
				}
				if (!found) {
					gameName = gameNameWithUnderscore;
					if (!gameName.includes("_")) {
						for (let j = 0; j < gameNames.length; j++) {
							if (gameNames[j]!.replace(/'/g, "").replace(/\(/g, "").replace(/\)/g, "") === gameName) {
								found = true;
								gameName = gameNames[j]!;
								SQLRequestCluster1 += "Games.Name = \\\"" + gameName + "\\\")";
								break;
							}
						}
						if (!found) {
							console.error(clusters[0]![clusters[0]!.length - 1] + " is never found in the list of game names.");
							process.exit(1);
						}
					}
				}
			}
		}

		// Request for Cluster 2.
		for (let i = 0; i < clusters[1]!.length - 1; i++) {
			let gameName = clusters[1]![i]!;
			let found = false;
			while (!found) {
				const gameNameWithUnderscore = gameName.substring(0, gameName.lastIndexOf('_'));
				gameName = gameNameWithUnderscore.replace(/_/g, ' ');
				for (let j = 0; j < gameNames.length; j++) {
					if (gameNames[j]!.replace(/'/g, "").replace(/\(/g, "").replace(/\)/g, "") === gameName) {
						found = true;
						gameName = gameNames[j]!;
						SQLRequestCluster2 += "Games.Name = \\\"" + gameName + "\\\" OR ";
						break;
					}
				}
				gameName = gameNameWithUnderscore;
				if (!gameName.includes("_")) {
					for (let j = 0; j < gameNames.length; j++) {
						if (gameNames[j]!.replace(/'/g, "").replace(/\(/g, "").replace(/\)/g, "") === gameName) {
							found = true;
							gameName = gameNames[j]!;
							SQLRequestCluster2 += "Games.Name = \\\"" + gameName + "\\\" OR ";
							break;
						}
					}
					if (!found) {
						console.error(clusters[1]![i] + " is never found in the list of game names.");
						process.exit(1);
					}
				}
			}
		}
		{
			let gameName = clusters[1]![clusters[1]!.length - 1]!;
			let found = false;
			while (!found) {
				const gameNameWithUnderscore = gameName.substring(0, gameName.lastIndexOf('_'));
				gameName = gameNameWithUnderscore.replace(/_/g, ' ');
				for (let j = 0; j < gameNames.length; j++) {
					if (gameNames[j]!.replace(/'/g, "").replace(/\(/g, "").replace(/\)/g, "") === gameName) {
						found = true;
						gameName = gameNames[j]!;
						SQLRequestCluster2 += "Games.Name = \\\"" + gameName + "\\\")";
						break;
					}
				}
				if (!found) {
					gameName = gameNameWithUnderscore;
					if (!gameName.includes("_")) {
						for (let j = 0; j < gameNames.length; j++) {
							if (gameNames[j]!.replace(/'/g, "").replace(/\(/g, "").replace(/\)/g, "") === gameName) {
								found = true;
								gameName = gameNames[j]!;
								SQLRequestCluster2 += "Games.Name = \\\"" + gameName + "\\\")";
								break;
							}
						}
						if (!found) {
							console.error(clusters[1]![clusters[1]!.length - 1] + " is never found in the list of game names.");
							process.exit(1);
						}
					}
				}
			}
		}

		// Request for Cluster 3.
		for (let i = 0; i < clusters[2]!.length - 1; i++) {
			let gameName = clusters[2]![i]!;
			let found = false;
			while (!found) {
				const gameNameWithUnderscore = gameName.substring(0, gameName.lastIndexOf('_'));
				gameName = gameNameWithUnderscore.replace(/_/g, ' ');
				for (let j = 0; j < gameNames.length; j++) {
					if (gameNames[j]!.replace(/'/g, "").replace(/\(/g, "").replace(/\)/g, "") === gameName) {
						found = true;
						gameName = gameNames[j]!;
						SQLRequestCluster3 += "Games.Name = \\\"" + gameName + "\\\" OR ";
						break;
					}
				}
				gameName = gameNameWithUnderscore;
				if (!gameName.includes("_")) {
					for (let j = 0; j < gameNames.length; j++) {
						if (gameNames[j]!.replace(/'/g, "").replace(/\(/g, "").replace(/\)/g, "") === gameName) {
							found = true;
							gameName = gameNames[j]!;
							SQLRequestCluster3 += "Games.Name = \\\"" + gameName + "\\\" OR ";
							break;
						}
					}
					if (!found) {
						console.error(clusters[2]![i] + " is never found in the list of game names.");
						process.exit(1);
					}
				}
			}
		}
		{
			let gameName = clusters[2]![clusters[2]!.length - 1]!;
			let found = false;
			while (!found) {
				const gameNameWithUnderscore = gameName.substring(0, gameName.lastIndexOf('_'));
				gameName = gameNameWithUnderscore.replace(/_/g, ' ');
				for (let j = 0; j < gameNames.length; j++) {
					if (gameNames[j]!.replace(/'/g, "").replace(/\(/g, "").replace(/\)/g, "") === gameName) {
						found = true;
						gameName = gameNames[j]!;
						SQLRequestCluster3 += "Games.Name = \\\"" + gameName + "\\\")";
						break;
					}
				}
				if (!found) {
					gameName = gameNameWithUnderscore;
					if (!gameName.includes("_")) {
						for (let j = 0; j < gameNames.length; j++) {
							if (gameNames[j]!.replace(/'/g, "").replace(/\(/g, "").replace(/\)/g, "") === gameName) {
								found = true;
								gameName = gameNames[j]!;
								SQLRequestCluster3 += "Games.Name = \\\"" + gameName + "\\\")";
								break;
							}
						}
						if (!found) {
							console.error(clusters[2]![clusters[2]!.length - 1] + " is never found in the list of game names.");
							process.exit(1);
						}
					}
				}
			}
		}

		// Request for Cluster 4.
		for (let i = 0; i < clusters[3]!.length - 1; i++) {
			let gameName = clusters[3]![i]!;
			let found = false;
			while (!found) {
				const gameNameWithUnderscore = gameName.substring(0, gameName.lastIndexOf('_'));
				gameName = gameNameWithUnderscore.replace(/_/g, ' ');
				for (let j = 0; j < gameNames.length; j++) {
					if (gameNames[j]!.replace(/'/g, "").replace(/\(/g, "").replace(/\)/g, "") === gameName) {
						found = true;
						gameName = gameNames[j]!;
						SQLRequestCluster4 += "Games.Name = \\\"" + gameName + "\\\" OR ";
						break;
					}
				}
				gameName = gameNameWithUnderscore;
				if (!gameName.includes("_")) {
					for (let j = 0; j < gameNames.length; j++) {
						if (gameNames[j]!.replace(/'/g, "").replace(/\(/g, "").replace(/\)/g, "") === gameName) {
							found = true;
							gameName = gameNames[j]!;
							SQLRequestCluster4 += "Games.Name = \\\"" + gameName + "\\\" OR ";
							break;
						}
					}
					if (!found) {
						console.error(clusters[3]![i] + " is never found in the list of game names.");
						process.exit(1);
					}
				}
			}
		}
		{
			let gameName = clusters[3]![clusters[3]!.length - 1]!;
			let found = false;
			while (!found) {
				const gameNameWithUnderscore = gameName.substring(0, gameName.lastIndexOf('_'));
				gameName = gameNameWithUnderscore.replace(/_/g, ' ');
				for (let j = 0; j < gameNames.length; j++) {
					if (gameNames[j]!.replace(/'/g, "").replace(/\(/g, "").replace(/\)/g, "") === gameName) {
						found = true;
						gameName = gameNames[j]!;
						SQLRequestCluster4 += "Games.Name = \\\"" + gameName + "\\\")";
						break;
					}
				}
				if (!found) {
					gameName = gameNameWithUnderscore;
					if (!gameName.includes("_")) {
						for (let j = 0; j < gameNames.length; j++) {
							if (gameNames[j]!.replace(/'/g, "").replace(/\(/g, "").replace(/\)/g, "") === gameName) {
								found = true;
								gameName = gameNames[j]!;
								SQLRequestCluster4 += "Games.Name = \\\"" + gameName + "\\\")";
								break;
							}
						}
						if (!found) {
							console.error(clusters[3]![clusters[3]!.length - 1] + " is never found in the list of game names.");
							process.exit(1);
						}
					}
				}
			}
		}

		console.log(SQLRequestCluster1);
		console.log("********************");
		console.log(SQLRequestCluster2);
		console.log("********************");
		console.log(SQLRequestCluster3);
		console.log("********************");
		console.log(SQLRequestCluster4);
	}
}
